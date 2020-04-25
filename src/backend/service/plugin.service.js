const { stat } = require('fs');
const { sep } = require('path');
const { promisify } = require('util');
const { watch } = require('chokidar');
const { PackagePlugin, FilePlugin, PluginType } = require('../model/plugin');

const asyncStat = promisify(stat);

class PluginService {
    constructor(preferencesService, databaseService) {
        this._preferencesService = preferencesService;
        this._databaseService = databaseService;
        this._pluginDirectories = [
            preferencesService.getInternalPluginDirectory(),
            preferencesService.getExternalPluginDirectory()
        ];

        this._pluginCache = {};

        this._watcher = watch(this._pluginDirectories, {
            ignored: '**/node_modules/**',
            persistent: false,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this._handleWatchEvent = this._handleWatchEvent.bind(this);
        this._watcher.on('all', this._handleWatchEvent);
    }

    async getMetaPlugins() {
        return await this._listPlugins(PluginType.META);
    }

    async getPrePlugins() {
        return await this._listPlugins(PluginType.PRE);
    }

    async getFilterPlugins() {
        return await this._listPlugins(PluginType.FILTER);
    }

    async getPostPlugins() {
        return await this._listPlugins(PluginType.POST);
    }

    async getExecPlugins() {
        return await this._listPlugins(PluginType.EXEC);
    }

    async getAllPlugins() {
        return await this._listPlugins();
    }

    async _listPlugins(type) {
        const plugins = await (!!type ?
            this._databaseService.all(`
                SELECT *
                FROM Plugins p
                JOIN PluginType t
                ON p.id = t.pluginId
                WHERE t.type = :type AND p.enabled = 1
            `, {
                ':type': type
            }) :
            this._databaseService.all(`
                SELECT *
                FROM Plugins
            `));

        return plugins.map(plugin => this._pluginCache[plugin.id]);
    }

    async _unloadPlugin(descriptor) {
        if (!descriptor) {
            return;
        }

        await this._databaseService.run(`
                UPDATE Plugins
                SET enabled = 0
                WHERE id = :pluginId
            `, {
                ':pluginId': descriptor.id
            });

        await this._databaseService.run(`
                DELETE FROM PluginType
                WHERE pluginId = :pluginId
            `, {
                ':pluginId': descriptor.id
            });
        
        delete this._pluginCache[descriptor.id];
    }

    async _loadPlugin(pluginType, pluginPath) {
        const plugin = pluginType === 'file'
            ? new FilePlugin(pluginPath)
            : new PackagePlugin(pluginPath);

        const pluginInfo = await plugin.getPluginInfo();

        const result = await this._databaseService.run(`
            INSERT INTO Plugins (loader, path, enabled, failureSafe, name, description, version)
            VALUES (:loader, :path, 1, :failureSafe, :name, :description, :version)
            ON CONFLICT (path) DO UPDATE SET
            loader = :loader,
            enabled = 1,
            failureSafe = :failureSafe,
            name = :name,
            description = :description,
            version = :version
            WHERE path = :path
        `, {
            ':loader': pluginType,
            ':path': pluginPath,
            ':failureSafe': !!pluginInfo.failureSafe ? 1 : 0,
            ':name': pluginInfo.name,
            ':description': pluginInfo.description,
            ':version': pluginInfo.version
        });

        let id = result.lastID;
        if (id === 0) {
            id = (await this._databaseService.get(`
                SELECT id from Plugins WHERE path = :path
            `, {
                ':path': pluginPath
            })).id;
        }

        await Promise.all(pluginInfo.types.map(type => this._databaseService.run(`
                INSERT INTO PluginType (pluginId, type)
                VALUES (:pluginId, :type)
                ON CONFLICT (pluginId, type) DO NOTHING
            `, {
                ':pluginId': id,
                ':type': type
            })));

        this._pluginCache[id] = plugin;
        pluginInfo.id = id;
        plugin.setPluginId(id);
        return pluginInfo;
    }
    
    async _reloadPlugin(pluginType, descriptor) {
        let shouldReload = descriptor.loader !== pluginType;

        if (!shouldReload) {
            const loadedPlugin = this._pluginCache[descriptor.id];
            if (loadedPlugin) {
                const pluginInfo = await loadedPlugin.getPluginInfo();
                const infoFieldsForComparison = ['name', 'description', 'version', 'failureSafe'];
                shouldReload = infoFieldsForComparison.some(field => pluginInfo[field] !== descriptor[field])
            }
            else {
                shouldReload = true;
            }
        }

        if (shouldReload) {
            await this._unloadPlugin(descriptor);
            await this._loadPlugin(pluginType, descriptor.path);
        }
    }

    _getRelevantModuleForPath(path) {
        const pluginDir = this._pluginDirectories.find(dir => path.startsWith(dir));
        if (!pluginDir) {
            return null;
        }
        const sliced = path.slice(pluginDir.length + 1);
        const index = sliced.indexOf(sep);
        const pluginFileOrDirName = sliced.substr(0, index < 0 ? sliced.length : index);
        if (pluginFileOrDirName === '') {
            return null;
        }
        return pluginDir + sep + sliced.substr(0, index < 0 ? sliced.length : index);
    }

    async _handleWatchEvent(_, path) {
        const pluginPath = this._getRelevantModuleForPath(path);
        if (pluginPath === null) {
            return;
        }

        const pluginStatusPromise = asyncStat(pluginPath)
            .then(s => s.isFile() ? 'file' : 'package')
            .catch(() => 'deleted');
        const databaseLookupPromise = this._databaseService.get(`
                SELECT * from Plugins
                WHERE path = :pluginPath AND enabled = 1
            `, {
                ':pluginPath': pluginPath
            });

        const statResult = await pluginStatusPromise;
        const databaseResult = await databaseLookupPromise;
        
        if (statResult === 'deleted') {
            if (databaseResult) {
                await this._unloadPlugin(databaseResult);
                LOG.warn(`Unloaded plugin ${databaseResult.name}@${databaseResult.version} (ID=${databaseResult.id})`);
            }
        }
        else if (!databaseResult) {
            const info = await this._loadPlugin(statResult, pluginPath);
            if (info) {
                LOG.warn(`Loaded plugin ${info.name}@${info.version} (ID=${info.id})`);
            }
        }
        else {
            await this._reloadPlugin(statResult, databaseResult);
            LOG.warn(`Reloaded plugin ${databaseResult.name}@${databaseResult.version} (ID=${databaseResult.id})`);
        }
    }
}

module.exports = PluginService;
