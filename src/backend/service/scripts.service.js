const { readdir } = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const { PackageScript, FileScript, ScriptType } = require('../model/script');

const asyncReadDir = promisify(readdir);

class ScriptsService {
    constructor(scriptsDirectories) {
        this._scriptsDirectories = scriptsDirectories;
    }

    async getPreScripts() {
        return await this._getAllScriptsOfType(ScriptType.PRE);
    }

    async getPostScripts() {
        return await this._getAllScriptsOfType(ScriptType.POST);
    }

    async getExecScripts() {
        return await this._getAllScriptsOfType(ScriptType.EXEC);
    }

    async getAllScripts() {
        return await this._listScripts();
    }

    async _getAllScriptsOfType(scriptType) {
        const scripts = await this._listScripts();
        return this._filter(scripts, async(script) => {
            const types = (await script.getScriptInfo()).types;
            return types.includes(scriptType);
        });
    }

    async _filter(arr, callback) {
        const fail = Symbol();
        const items = arr.map(async(item) => (await callback(item)) ? item : fail);
        return (await Promise.all(items))
            .filter(i => i !== fail);
    }

    async _listScripts() {
        return await Promise.all(this._scriptsDirectories.map(dir => this._listScriptsInDirectory(dir)));
    }

    async _listScriptsInDirectory(scriptsDirectory) {
        const files = await asyncReadDir(scriptsDirectory, {
            encoding: 'utf8',
            withFileTypes: true
        });

        let scriptsInDir = [];
        if (!this._scriptsDirectories.includes(scriptsDirectory)) {
            scriptsInDir = (await Promise.all(files.filter(file => file.isDirectory())
                .map(dir => this._listScriptsInDirectory(join(this._scriptsDirectory, dir.name)))))
                .flatMap(a => a);
        }

        const scriptFiles = files.filter(file => file.isFile());
        const packageFiles = scriptFiles.filter(file => file.name === 'package.json');
        if (packageFiles.length === 1) {
            return scriptsInDir.concat([
                new PackageScript(join(scriptsDirectory, 'package.json'))
            ]);
        } else {
            return scriptsInDir.concat(scriptFiles.filter(file => file.name.endsWith('.js'))
                .map(file => new FileScript(join(scriptsDirectory, file.name), file.name)));
        }
    }
}

module.exports = ScriptsService;
