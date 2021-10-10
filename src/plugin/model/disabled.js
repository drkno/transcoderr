const Plugin = require('./base');

class DisabledPlugin extends Plugin {
    constructor(descriptor, types) {
        super(false);
        this._descriptor = descriptor;
        this._descriptor.types = this.__convertToPluginType(types || []);

        this.setPluginId(this._descriptor.id);
    }

    async getChecksum() {
        return this._descriptor.name;
    }

    async getPlugin() {
        throw new Error('The plugin must be loaded first');
    }

    async _loadPluginInfo() {
        return this._descriptor;
    }

    async __shouldInvalidate() {
        return false;
    }
}

module.exports = DisabledPlugin;
