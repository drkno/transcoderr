const { readFile } = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const Plugin = require('./base');

const asyncReadFile = promisify(readFile);

class PackagePlugin extends Plugin {
    constructor(pluginFolder) {
        super();
        this._pluginFolder = pluginFolder;
        this._version = null;
        this._packageJsonCache = null;
        this._packageJsonHash = null;
    }

    async getChecksum() {
        return this._packageJsonHash;
    }

    async getPlugin() {
        const json = await this._getJsonContents();
        const main = join(this._pluginFolder, json.main);
        return await this.__getPlugin(main, json.name);
    }

    async _loadPluginInfo() {
        const json = await this._getJsonContents();
        return {
            name: json.name,
            description: json.description,
            version: json.version,
            path: this._pluginFolder,
            types: this.__convertToPluginType(json.pluginTypes)
        };
    }

    async __shouldInvalidate() {
        const json = await this._getJsonContents();
        const version = json.version;
        if (version !== this._version) {
            this._version = version;
            return true;
        }
        return false;
    }

    async _getJsonContents() {
        try {
            const packageJsonLocation = join(this._pluginFolder, 'package.json');
            const fileHash = await this.__checksumFile(packageJsonLocation);
            if (this._packageJsonCache === null || fileHash !== this._packageJsonHash) {
                this._packageJsonCache = JSON.parse(await asyncReadFile(packageJsonLocation, {
                    encoding: 'utf8'
                }));
                this._packageJsonHash = fileHash;
            }
            return this._packageJsonCache;
        } catch (e) {
            LOG.error(e);
            this.__setHasErrors();
            return {};
        }
    }
}

module.exports = PackagePlugin;
