class CodecPrePlugin {
    describe() {
        return {
            name: 'codec',
            description: 'generates codec ffmpeg options',
            version: '1.0.0',
            types: ['pre'],
            failureSafe: true
        };
    }

    async premain(collector) {
        const codec = collector.getMetaData()
            .probe
            .streams
            .filter(v => v.codec_type === 'video')
            .map(v => v.codec_name)[0];

        if (codec) {
            if (codec !== 'h264') {
                collector.appendFfmpegOptions(['-c:v', 'libx264']);
            }
        }
        else {
            // not a video
            collector.setDelete();
        }
    }
}

module.exports = new CodecPrePlugin();
