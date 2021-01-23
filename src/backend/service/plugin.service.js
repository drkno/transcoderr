const { stat } = require('fs');
const { sep } = require('path');
const { promisify } = require('util');
const { watch } = require('chokidar');
const { PackagePlugin, FilePlugin, PluginType } = require('../model/plugin');
const { debounceArgs } = require('../utils/debounce');

const asyncStat = promisify(stat);

class PluginService {
    constructor(preferencesService, databaseService) {
        this._preferencesService = preferencesService;
        this._databaseService = databaseService;
        this._pluginDirectories = [
            preferencesService.getInternalPluginDirectory(),
            preferencesService.getExternalPluginDirectory()
        ];

        this._lastLoad = Promise.resolve();
        this._pluginCache = {};

        this._watcher = watch(this._pluginDirectories, {
            ignored: '**/node_modules/**',
            persistent: false,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this._handleWatchEventDeduplicated = debounceArgs(200, this._handleWatchEventDeduplicated.bind(this));
        this._watcher.on('all', this._handleWatchEvent.bind(this));
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
                SELECT p.*
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

        return plugins.map(plugin => {
                const cachedPlugin = this._pluginCache[plugin.id];
                if (!cachedPlugin) {
                    LOG.warn(`Plugin ${plugin.id} does not appear to be loaded. Has it been uninstalled?`);
                    this._unloadPlugin(plugin);
                }
                return cachedPlugin;
            })
            .filter(plugin => !!plugin);
    }

    async _unloadPlugin(descriptor) {
        if (!descriptor) {
            return;
        }

        LOG.warn(`Unloading plugin ${descriptor.name}@${descriptor.version} (ID=${descriptor.id})`);

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

        LOG.warn(`Unloading plugin ${descriptor.name}@${descriptor.version} complete (ID=${descriptor.id})`);
    }

    async _loadPlugin(pluginType, pluginPath) {
        const plugin = pluginType === 'file'
            ? new FilePlugin(pluginPath)
            : new PackagePlugin(pluginPath);

        const pluginInfo = await plugin.getPluginInfo();

        LOG.warn(`Loading plugin ${pluginInfo.name}...`);

        await this._databaseService.run(`
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

        const id = (await this._databaseService.get(`
                SELECT id from Plugins WHERE path = :path
            `, {
                ':path': pluginPath
            })).id;

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

        LOG.warn(`Loading plugin ${pluginInfo.name}@${pluginInfo.version} complete (ID=${pluginInfo.id})`);

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

    _handleWatchEvent(_, path) {
        this._lastLoad = this._lastLoad.then(async() => {
            try {
                const pluginPath = this._getRelevantModuleForPath(path);
                if (pluginPath === null) {
                    return;
                }
                await this._handleWatchEventDeduplicated(pluginPath);
            }
            catch (e) {
                LOG.error(`Modifying plugin state for plugin at path '${path}' failed.`, e);
            }
        });
    }

    async _handleWatchEventDeduplicated(pluginPath) {
        const statResult = await this._getPluginType(pluginPath);
        const databaseResult = await this._databaseService.get(`
                SELECT * from Plugins
                WHERE path = :pluginPath
            `, {
                ':pluginPath': pluginPath
            });

        if (statResult === 'deleted') {
            if (databaseResult) {
                await this._unloadPlugin(databaseResult);
            }
        }
        else if (!databaseResult || (databaseResult && !this._pluginCache[databaseResult.id])) {
            await this._loadPlugin(statResult, pluginPath);
        }
        else if (databaseResult.enabled === 1) {
            await this._reloadPlugin(statResult, databaseResult);
        }
    }

    async _getPluginType(path) {
        try {
            const result = await asyncStat(path)
            return result.isFile() ? 'file' : 'package';
        }
        catch (e) {
            return 'deleted';
        }
    }
}

module.exports = PluginService;
