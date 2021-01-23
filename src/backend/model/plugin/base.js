const { createHash } = require('crypto');
const { createReadStream } = require('fs');
const SandboxedModule = require('sandboxed-module');
const PluginType = require('./type');

class PluginLogger {
    constructor(name) {
        const logNames = ['emerg', 'crit', 'alert', 'warning', 'notice', 'info', 'debug', 'warn', 'http', 'verbose', 'silly', 'error'];
        for (let callName of logNames) {
            this._wrapCall(callName, name);
        }
    }

    _wrapCall(callName, name) {
        this[callName] = arg => {
            if (typeof(arg) !== 'string') {
                try {
                    arg = JSON.stringify(arg, null, 4);
                } catch(e) {}
            }
            return global.LOG[callName].apply(global.LOG, [`[${name}] ` + arg]);
        };
    }
}

class Plugin {
    constructor() {
        this._plugin = null;
        this._pluginId = null;
        this._pluginInfo = null;
        this._hasErrors = false;
    }

    getPluginId() {
        return this._pluginId;
    }

    setPluginId(id) {
        this._pluginId = id;
        if (this._pluginInfo) {
            this._pluginInfo.id = id;
        }
    }

    async getPluginInfo() {
        if (!this._pluginInfo) {
            this._pluginInfo = await this._loadPluginInfo();
        }
        return this._pluginInfo;
    }

    getTypes() {
        return this._pluginInfo.types;
    }

    shouldReload() {
        this._plugin = null;
    }

    hasErrors() {
        return this._hasErrors;
    }

    __setHasErrors() {
        this._hasErrors = true;
    }

    async __getPlugin(pluginPath, pluginName) {
        try {
            const shouldInvalidate = await this.__shouldInvalidate();
            if (this._plugin === null || shouldInvalidate) {
                this._plugin = SandboxedModule.require(pluginPath, {
                    globals: {
                        LOG: new PluginLogger(pluginName)
                    }
                });
            }
            return this._plugin;
        } catch (e) {
            this.__setHasErrors();
            LOG.error(e);
            return {
                describe: () => ({})
            };
        }
    }

    async __shouldInvalidate() {
        throw new Error('Should be overridden');
    }

    __convertToPluginType(types) {
        return (types || []).map(type => PluginType.from(type) || false)
            .filter(type => type !== false);
    }

    __checksumFile(path) {
        return new Promise((resolve, reject) => {
            const hash = createHash('md5');
            const stream = createReadStream(path);
            stream.on('error', err => reject(err));
            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }

    toJSON() {
        return Object.assign({
            enabled: true,
            hasErrors: this._hasErrors
        }, this._pluginInfo);
    }

    toString() {
        return this.toJSON();
    }
}

module.exports = Plugin;
