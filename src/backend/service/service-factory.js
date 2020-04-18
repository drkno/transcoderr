const { join } = require('path');

const DatabaseService = require('./database.service');
const EnvironmentService = require('./environment.service');
const ExecutorService = require('./executor.service');
const JobsService = require('./jobs.service');
const PreferencesService = require('./preferences.service');
const ScriptsService = require('./scripts.service');

class ServiceFactory {
    getDatabaseService() {
        return this._lazyInstantiate('_database', () => {
            const environmentService = this.getEnvironmentService();
            return new DatabaseService(environmentService);
        });
    }

    getEnvironmentService() {
        return this._lazyInstantiate('_environment', () => new EnvironmentService(process.env));
    }

    getExecutorService() {
        return this._lazyInstantiate('_executor', () => {
            const jobsService = this.getJobsService();
            const scriptService = this.getScriptService();
            return new ExecutorService(scriptService, jobsService);
        });
    }

    getJobsService() {
        return this._lazyInstantiate('_jobs', () => {
            const databaseService = this.getDatabaseService();
            return new JobsService(databaseService);
        });
    }

    getPreferencesService() {
        return this._lazyInstantiate('_preferences', () => {
            const environmentService = this.getEnvironmentService();
            const databaseService = this.getDatabaseService();
            return new PreferencesService(environmentService, databaseService);
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
