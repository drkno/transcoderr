const { rename, unlink } = require('fs');
const { promisify } = require('util');

const renamep = promisify(rename);
const unlinkp = promisify(unlink);

class MovePostPlugin {
    constructor(serviceFactory) {
        this._preferencesService = serviceFactory.getPreferencesService();
    }

    describe() {
        return {
            name: 'move',
            description: 'overwrites the origional files',
            version: '1.0.0',
            types: ['post'],
            failureSafe: true
        };
    }

    async postmain(collector) {
        const outputPath = collector.getOutputPath();
        if (!outputPath) {
            throw new Error('Output path was not defined');
        }

        const origionalPath = collector.getMetaData().file;
        if (!origionalPath) {
            throw new Error('Origional path was not defined');
        }

        const mode = await this._preferencesService.getOrSetDefault('plugin.move.mode', 'swap');
        LOG.info(`Replacing '${origionalPath}' with '${outputPath}' in mode ${mode}`);

        try {
            switch(mode) {
                case 'delete':
                    await unlinkp(origionalPath);
                    await renamep(outputPath, origionalPath);
                default:
                    await renamep(origionalPath, origionalPath + '.transcoderr-old');
                    await renamep(outputPath, origionalPath);
                    break;
            }
        } catch (e) {
            LOG.error(`Replacing '${origionalPath}' with '${outputPath}' failed with error`, e);
            throw e;
        }
    }
}

module.exports = MovePostPlugin;
