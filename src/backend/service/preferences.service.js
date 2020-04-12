class PreferencesService {
    getDataDirectory() {
        return process.env.DATA_DIRECTORY || '.';
    }

    getPort() {
        return process.env.PORT || 4300;
    }

    getLogLevel() {
        return process.env.LOG_LEVEL || 'info';
    }

    async getPreferencesForId(id) {
        
    }
}

module.exports = PreferencesService;
