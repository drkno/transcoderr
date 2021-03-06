const EventEmitter = require('../utils/EventEmitter');

class PreferencesService extends EventEmitter {
    constructor(environmentService, databaseService) {
        super();
        this._environmentService = environmentService;
        this._databaseService = databaseService;
        this._preferenceCache = {};
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

    getMediaDirectory() {
        return this._environmentService.getMediaDirectory();
    }

    getMediaDirectoryRegex() {
        return this._environmentService.getMediaDirectoryRegex();
    }

    getPort() {
        return this._environmentService.getPort();
    }

    getLogLevel() {
        return this._environmentService.getLogLevel();
    }

    async getAll() {
        const values = await this._databaseService.all(`SELECT key, value from Preferences`);
        const map = {};
        for (let entry of values) {
            map[entry.key] = entry.value;
        }
        return map;
    }

    async getPreferencesForId(id) {
        if (this._preferenceCache[id]) {
            return this._preferenceCache[id];
        }
        const value = await this._databaseService.get(
            `SELECT value from Preferences where key = :key`, {
                ':key': id
            }
        );
        this._preferenceCache[id] = !!value ? value.value : null;
        return this._preferenceCache[id];
    }

    async setPreferenceForId(id, value) {
        if (this._preferenceCache[id]) {
            delete this._preferenceCache[id];
        }

        await this._databaseService.run(`
            INSERT INTO Preferences (key, value)
            VALUES (:key, :value)
            ON CONFLICT (key) DO UPDATE SET
            value = :value
            WHERE key = :key
        `, {
            ':key': id,
            ':value': value
        });

        this.emit('config-changed', {
            [id]: value
        });
    }

    async getOrSetDefault(id, defaultValue) {
        const value = await this.getPreferencesForId(id);
        if (!value) {
            await this.setPreferenceForId(id, defaultValue);
            return defaultValue;
        }
        return value;
    }

    async deletePreference(id) {
        await this._databaseService.run(`
            DELETE from Preferences
            WHERE key = :key
        `, {
            ':key': id
        });
        this.emit('config-deleted', {
            key: id
        });
    }
}

module.exports = PreferencesService;
