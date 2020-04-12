const { unlinkSync } = require('fs');

class DeleteFilterScript {
    describe() {
        return {
            name: 'delete',
            description: 'removes files marked for deletion',
            version: '1.0.0',
            types: ['filter']
        };
    }

    async filtermain(collector) {
        if (collector.shouldDelete()) {
            collector.vetoExec();
            LOG.warn(`Deleting '${collector.getMetaData().file}'`);
            unlinkSync(collector.getMetaData().file);
        }
    }
}

module.exports = new DeleteFilterScript();
