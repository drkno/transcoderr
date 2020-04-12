const { join } = require('path');

const PreferencesService = require('./preferences.service');
const ExecutorService = require('./executor.service');
const ScriptsService = require('./scripts.service');

class ServiceFactory {
    getPreferencesService() {
        return this._lazyInstantiate('_preferences', () => new PreferencesService());
    }

    getScriptService() {
        return this._lazyInstantiate('_scripts', () => {
            const preferencesService = this.getPreferencesService();
            return new ScriptsService(preferencesService);
        });
    }

    getExecutorService() {
        return this._lazyInstantiate('_executor', () => {
            const scriptService = this.getScriptService();
            return new ExecutorService(scriptService);
        });
    }

    _lazyInstantiate(property, compute) {
        if (!this[property]) {
            this[property] = compute();
        }
        return this[property];
    }
}

module.exports = new ServiceFactory();
