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

        const codec = collector.getMetaData()
            .probe
            .streams
            .filter(v => v.codec_type === 'video')
            .filter(v => v.codec_name === 'h264')[0];

        if (codec) {
            // lossless crop
            const left = xOffset;
            const right = codec.width - x - xOffset;
            const top = yOffset;
            const bottom = codec.height - y - yOffset;
            collector.appendFfmpegOptions([
                '-bsf:v', `h264_metadata=crop_left=${left}:crop_right=${right}:crop_top=${top}:crop_bottom=${bottom}`
            ]);
        }
        else {
            collector.appendFfmpegOptions([
                '-filter:v', `crop=${x}:${y}:${xOffset}:${yOffset}`
            ]);
        }
    }
}

module.exports = CropPrePlugin;
