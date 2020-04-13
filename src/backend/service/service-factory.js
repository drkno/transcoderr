const { join } = require('path');

const DatabaseService = require('./environment.service');
const PreferencesService = require('./preferences.service');
const EnvironmentService = require('./environment.service');
const ExecutorService = require('./executor.service');
const ScriptsService = require('./scripts.service');

class ServiceFactory {
    getDatabaseService() {
        return this._lazyInstantiate('_database', () => {
            const environmentService = this.getEnvironmentService();
            return new DatabaseService(environmentService);
        });
    }

    getPreferencesService() {
        return this._lazyInstantiate('_preferences', () => {
            const environmentService = this.getEnvironmentService();
            const databaseService = this.getDatabaseService();
            return new PreferencesService(environmentService, databaseService);
        });
    }

    getEnvironmentService() {
        return this._lazyInstantiate('_environment', () => new EnvironmentService(process.env));
    }

    getExecutorService() {
        return this._lazyInstantiate('_executor', () => {
            const scriptService = this.getScriptService();
            return new ExecutorService(scriptService);
        });
    }

    getScriptService() {
        return this._lazyInstantiate('_scripts', () => {
            const preferencesService = this.getPreferencesService();
            return new ScriptsService(preferencesService);
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
