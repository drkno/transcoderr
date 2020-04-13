const { statSync, mkdirSync } = require('fs');
const { join } = require('path');

class EnvironmentService {
    constructor(environment) {
        this._environment = environment;
        this._checks = {
            dataDirectory: false,
            pluginDirectory: false
        };
    }

    getDataDirectory() {
        const directory = this._environment.DATA_DIRECTORY || './temp';
        this._ensureExists('dataDirectory');
        return directory;
    }

    getInternalPluginDirectory() {
        return join(__dirname, '../scripts');
    }

    getExternalPluginDirectory() {
        const directory = join(this.getDataDirectory(), 'plugins');
        this._ensureExists('pluginDirectory');
        return directory;
    }

    getDatabaseName() {
        return this._environment.DATABASE_NAME || 'transcoderr.db';
    }

    getDatabaseLocation() {
        return join(this.getDataDirectory(), this.getDatabaseName());
    }

    getDatabaseMigrationsLocation() {
        return join(__dirname, '../migrations');
    }

    getPort() {
        return this._environment.PORT || 4300;
    }

    getLogLevel() {
        return this._environment.LOG_LEVEL || 'info';
    }

    _ensureExists(checkName, location) {
        // note: this is deliberately sync, as calling code may not always be possible to make async
        if (!this._checks[checkName]) {
            try {
                statSync(location);
            } catch(e) {
                // yup, exceptions as flow control, forgive me
                mkdirSync(location);
            }
            this._checks[checkName] = true;
        }
    }
}

module.exports = EnvironmentService;
