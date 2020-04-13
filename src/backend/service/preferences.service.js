class PreferencesService {
    constructor(environmentService, databaseService) {
        this._environmentService = environmentService;
        this._databaseService = databaseService;
    }

    getDataDirectory() {
        return this._environmentService.getDataDirectory();
    }

    getInternalPluginDirectory() {
        return this._environmentService.getInternalPluginDirectory();
    }

    getExternalPluginDirectory() {
        return this._environmentService.getExternalPluginDirectory();
    }

    getDatabaseName() {
        return this._environmentService.getDatabaseName();
    }

    getDatabaseLocation() {
        return this._environmentService.getDatabaseLocation();
    }

    getPort() {
        return this._environmentService.getPort();
    }

    getLogLevel() {
        return this._environmentService.getLogLevel();
    }

    async getPreferencesForId(id) {
        
    }
}

module.exports = PreferencesService;
