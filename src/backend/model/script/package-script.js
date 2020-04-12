const { readFile } = require('fs');
const { join, dirname } = require('path');
const { promisify } = require('util');
const Script = require('./base');

const asyncReadFile = promisify(readFile);

class PackageScript extends Script {
    constructor(packageJsonLocation) {
        super();
        this._packageJsonLocation = packageJsonLocation;
        this._version = null;
        this._packageJsonCache = null;
        this._packageJsonHash = null;
    }

    async getScriptInfo() {
        const json = await this._getJsonContents();
        return {
            name: json.name,
            description: json.description,
            version: json.version,
            types: this.__convertToScriptType(json.scriptTypes)
        };
    }

    async getScript() {
        const json = await this._getJsonContents();
        const dir = dirname(this._packageJsonLocation);
        const main = join(dir, json.main);
        return await this.__getScript(main, json.name);
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
            const fileHash = await this.__checksumFile(this._packageJsonLocation);
            if (this._packageJsonCache === null || fileHash !== this._packageJsonHash) {
                this._packageJsonCache = JSON.parse(await asyncReadFile(this._packageJsonLocation, {
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

module.exports = PackageScript;
