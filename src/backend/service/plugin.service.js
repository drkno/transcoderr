const { readdir } = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const { PackagePlugin, FilePlugin, PluginType } = require('../model/plugin');

const asyncReadDir = promisify(readdir);

class PluginService {
    constructor(preferencesService, databaseService) {
        this._preferencesService = preferencesService;
        this._databaseService = databaseService;
        this._pluginDirectories = [
            preferencesService.getInternalPluginDirectory(),
            preferencesService.getExternalPluginDirectory()
        ];
    }

    async getMetaPlugins() {
        return await this._getAllPluginsOfType(PluginType.META);
    }

    async getPrePlugins() {
        return await this._getAllPluginsOfType(PluginType.PRE);
    }

    async getFilterPlugins() {
        return await this._getAllPluginsOfType(PluginType.FILTER);
    }

    async getPostPlugins() {
        return await this._getAllPluginsOfType(PluginType.POST);
    }

    async getExecPlugins() {
        return await this._getAllPluginsOfType(PluginType.EXEC);
    }

    async getAllPlugins() {
        return await this._listPlugins();
    }

    async _getAllPluginsOfType(pluginType) {
        const plugins = await this._listPlugins();
        return this._filter(plugins, async(plugin) => {
            const types = (await plugin.getPluginInfo()).types;
            return types.includes(pluginType);
        });
    }

    async _filter(arr, callback) {
        const fail = Symbol();
        const items = arr.map(async(item) => (await callback(item)) ? item : fail);
        return (await Promise.all(items))
            .filter(i => i !== fail);
    }

    async _listPlugins() {
        const plugins = (await Promise.all(this._pluginDirectories.map(dir => this._listPluginsInDirectory(dir))))
            .flatMap(a => a);
        await this._createOrUpdatePlugins(plugins);
        return plugins;
    }

    async _createOrUpdatePlugins(plugins) {
        const checksumData = await this._databaseService.all(`SELECT name, checksum FROM Plugin`);
        const checksumMap = checksumData.reduce((acc, curr) => (acc[curr.name] = curr.checksum, curr), {});

        return await Promise.all(plugins.map(plugin => this._createOrUpdatePlugin(plugin, checksumMap)));
    }

    async _createOrUpdatePlugin(plugin, checksumLookup = null) {
        const pluginInfo = await plugin.getPluginInfo();
        if (checksumLookup == null) {
            const results = await this._databaseService.get(`SELECT checksum FROM Plugin WHERE name = :name`, {
                ':name': pluginInfo.name
            });
            if (results.length === 1) {
                checksumLookup = {
                    [pluginInfo.name]: results[0].checksum
                };
            }
        }

        const pluginChecksum = await plugin.getChecksum();
        if (checksumLookup[pluginInfo.name] !== pluginChecksum) {
            await this._databaseService.run(`
                INSERT INTO Plugin (name, checksum)
                VALUES (:name, :checksum)
                ON CONFLICT (name) DO UPDATE SET
                checksum = :checksum
                WHERE name = :name
            `, {
                ':name': pluginInfo.name,
                ':checksum': pluginChecksum
            });

            LOG.warn(`New/updated plugin detected: ${pluginInfo.name}`);
        }
    }

    async _listPluginsInDirectory(pluginsDirectory) {
        const files = await asyncReadDir(pluginsDirectory, {
            encoding: 'utf8',
            withFileTypes: true
        });

        let pluginsInDir = [];
        if (!this._pluginDirectories.includes(pluginsDirectory)) {
            pluginsInDir = (await Promise.all(files.filter(file => file.isDirectory())
                .map(dir => this._listPluginsInDirectory(join(this._pluginsDirectory, dir.name)))))
                .flatMap(a => a);
        }

        const pluginFiles = files.filter(file => file.isFile());
        const packageFiles = pluginFiles.filter(file => file.name === 'package.json');
        if (packageFiles.length === 1) {
            return pluginsInDir.concat([
                new PackagePlugin(join(pluginsDirectory, 'package.json'))
            ]);
        } else {
            return pluginsInDir.concat(pluginFiles.filter(file => file.name.endsWith('.js'))
                .map(file => new FilePlugin(join(pluginsDirectory, file.name), file.name)));
        }
    }
}

module.exports = PluginService;
