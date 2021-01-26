const { dirname, basename, join, extname } = require('path');

class ContainerPrePlugin {
    constructor(serviceFactory) {
        this._preferencesService = serviceFactory.getPreferencesService();
    }

    describe() {
        return {
            name: 'container',
            description: 'generates container options',
            version: '1.0.0',
            types: ['pre'],
            failureSafe: true
        };
    }

    async premain(collector) {
        const allowedExtensions = (await this._preferencesService.getOrSetDefault(
            'plugin.container.extensions',
            '.mkv;.mp4'
        )).split(';');

        const fullPath = collector.getMetaData().file;
        const extension = extname(fullPath);

        if (!allowedExtensions.includes(extension)) {
            collector.setContainer(allowedExtensions[0]);
        }
    }
}

module.exports = ContainerPrePlugin;
