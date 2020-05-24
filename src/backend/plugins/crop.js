class CropPrePlugin {
    describe() {
        return {
            name: 'crop',
            description: 'generates crop ffmpeg options',
            version: '1.0.0',
            types: ['pre'],
            failureSafe: true
        };
    }

    async premain(collector) {
        const { dimensions } = collector.getMetaData();
        if (!dimensions) {
            LOG.warn('No dimensions set, so cannot generate crop.');
            return;
        }

        const { x, y, xOffset, yOffset } = dimensions;
        if (x <= 0 || y <= 0 || xOffset < 0 || yOffset < 0) {
            LOG.warn('Invalid crop detected, will not use.');
            return;
        }

        if (xOffset === 0 && yOffset === 0) {
            LOG.info('Crop not needed for this file');
            return;
        }

        collector.appendFfmpegOptions([
            '-filter:v', `crop=${x}:${y}:${xOffset}:${yOffset}`
        ]);
    }

    async _detectCrop(file) {
        
        return {
            x: cropDimensions.x.mostCommon,
            y: cropDimensions.y.mostCommon,
            xOffeset: cropDimensions.xOffset.mostCommon,
            yOffset: cropDimensions.yOffset.mostCommon
        };
    }
}

module.exports = new CropPrePlugin();
