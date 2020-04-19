const { statSync, mkdirSync } = require('fs');
const { join, resolve } = require('path');

class EnvironmentService {
    constructor(environment) {
        this._environment = environment;
        this._checks = {
            dataDirectory: false,
            pluginDirectory: false
        };
    }

    getDataDirectory() {
        const directory = resolve(this._environment.DATA_DIRECTORY || './temp');
        this._ensureExists('dataDirectory', directory);
        return directory;
    }

    getInternalPluginDirectory() {
        return resolve(join(__dirname, '../plugins'));
    }

    getExternalPluginDirectory() {
        const directory = resolve(join(this.getDataDirectory(), 'plugins'));
        this._ensureExists('pluginDirectory', directory);
        return directory;
    }

    getDatabaseName() {
        return this._environment.DATABASE_NAME || 'transcoderr.db';
    }

    getDatabaseLocation() {
        return join(this.getDataDirectory(), this.getDatabaseName());
    }

    getDatabaseMigrationsLocation() {
        return resolve(join(__dirname, '../migrations'));
    }

    isDatabaseDebugModeEnabled() {
        return !!this._environment.DEBUG_DATABASE_CALLS || false;
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
