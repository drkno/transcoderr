const { cached, verbose } = require('sqlite3');
const { open } = require('sqlite');

class DatabaseService {
    constructor(environmentService) {
        this._environmentService = environmentService;
        process.on('exit', this._closeDatabase.bind(this));
    }

    async get(...args) {
        const db = await this._getDatabase();
        this._prepareStatement(args);
        return await db.get.apply(db, args);
    }

    async exec(...args) {
        const db = await this._getDatabase();
        this._prepareStatement(args);
        return await db.exec.apply(db, args);
    }

    async all(...args) {
        const db = await this._getDatabase();
        this._prepareStatement(args);
        return await db.all.apply(db, args);
    }

    async run(...args) {
        const db = await this._getDatabase();
        this._prepareStatement(args);
        return await db.run.apply(db, args);
    }

    async prepare(...args) {
        const db = await this._getDatabase();
        this._prepareStatement(args);
        return await db.prepare.apply(db, args);
    }

    _prepareStatement(args) {
        let statement = args[0];
        let params = args[1];
        if (!Array.isArray(params)) {
            const inParams = Object.keys(params).filter(param => Array.isArray(params[param]));
            for (let i = 0; i < inParams.length; i++) {
                const param = inParams[i];
                const replaceParam = [];
                for (let j = 0; j < params[param].length; j++) {
                    const newParam = param + j;
                    const newParamValue = params[param][j];
                    params[newParam] = newParamValue;
                    replaceParam.push(newParam);
                }
                statement = statement.split(param)
                                     .join(replaceParam.join(', '));
                delete params[inParams[i]];
            }
        }

        for (let key of Object.keys(params)) {
            if (typeof(params[key]) === 'object' && params[key] !== null) {
                params[key] = params[key].toString();
            }
        }

        args[0] = statement;
        args[1] = params;
    }

    async _getDatabase() {
        if (!this._db) {
            if (this._environmentService.isDatabaseDebugModeEnabled()) {
                verbose();
            }

            this._db = await open({
                filename: this._environmentService.getDatabaseLocation(),
                driver: cached.Database
            });

            await this._db.get('PRAGMA foreign_keys = ON');

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
