const { cached } = require('sqlite3');
const { open } = require('sqlite');

class DatabaseService {
    constructor(environmentService) {
        this._environmentService = environmentService;
        process.on('exit', this._closeDatabase.bind(this));
    }

    async _getDatabase() {
        if (!this._db) {
            this._db = await open({
                filename: this._environmentService.getDatabaseLocation(),
                driver: cached.Database
            });

            await this._db.migrate({
                migrationsPath: this._environmentService.getDatabaseMigrationsLocation()
            });
        }
        return this._db;
    }

    _closeDatabase() {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }
}

module.exports = DatabaseService;
