const Plugin = require('./base');

class FilePlugin extends Plugin {
    constructor(fileLocation, fileName) {
        super();
        this._fileLocation = fileLocation;
        this._fileName = fileName;
        this._checksum = null;
    }

    async getChecksum() {
        return this._checksum;
    }

    async getPluginInfo() {
        const plugin = await this.getPlugin();
        const descriptor = Object.assign({
            name: this._fileName,
            description: '',
            version: -1,
            types: []
        }, plugin.describe());
        descriptor.types = this.__convertToPluginType(descriptor.types);

        return descriptor;
    }

    async getPlugin() {
        return await this.__getPlugin(this._fileLocation, this._fileName);
    }

    async __shouldInvalidate() {
        const checksum = await this.__checksumFile(this._fileLocation);
        if (checksum !== this._checksum) {
            this._checksum = checksum;
            return true;
        }
        return false;
    }
}

module.exports = FilePlugin;
