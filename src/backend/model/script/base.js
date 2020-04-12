const { createHash } = require('crypto');
const { createReadStream } = require('fs');
const SandboxedModule = require('sandboxed-module');
const ScriptType = require('./type');

class ScriptLogger {
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

class Script {
    constructor() {
        this._script = null;
        this._hasErrors = false;
    }

    shouldReload() {
        this._script = null;
    }

    hasErrors() {
        return this._hasErrors;
    }

    __setHasErrors() {
        this._hasErrors = true;
    }

    async __getScript(scriptPath, scriptName) {
        try {
            const shouldInvalidate = await this.__shouldInvalidate();
            if (this._script === null || shouldInvalidate) {
                this._script = SandboxedModule.require(scriptPath, {
                    globals: {
                        LOG: new ScriptLogger(scriptName)
                    }
                });
            }
            return this._script;
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

    __convertToScriptType(types) {
        return (types || []).map(type => {
                switch(type) {
                    case 'meta': return ScriptType.META;
                    case 'pre': return ScriptType.PRE;
                    case 'post': return ScriptType.POST;
                    case 'exec': return ScriptType.EXEC;
                    default: return false;
                }
            })
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
}

module.exports = Script;
