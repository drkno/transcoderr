const DESIRED_CODEC_NAME_KEY = 'plugin.codec.desired';
const DESIRED_CODEC_NAME_DEFAULT_VALUE = 'h264';
const DESIRED_CODEC_ENCODER_KEY = 'plugin.codec.encoder';
const DESIRED_CODEC_ENCODER_DEFAULT_VALUE = 'libx264';
const DESIRED_CODEC_CRF_KEY = 'plugin.codec.crf';
const DESIRED_CODEC_CRF_DEFAULT_VALUE = '17';
const DESIRED_CODEC_PRESET_KEY = 'plugin.codec.preset';
const DESIRED_CODEC_PRESET_DEFAULT_VALUE = 'veryfast';

class CodecPrePlugin {
    constructor(serviceFactory) {
        this._preferencesService = serviceFactory.getPreferencesService();
    }

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
            const desiredCodecName = await this._preferencesService.getOrSetDefault(
                DESIRED_CODEC_NAME_KEY,
                DESIRED_CODEC_NAME_DEFAULT_VALUE
            );
            if (codec !== desiredCodecName) {
                const encoder = await this._preferencesService.getOrSetDefault(
                    DESIRED_CODEC_ENCODER_KEY,
                    DESIRED_CODEC_ENCODER_DEFAULT_VALUE
                );
                const crf = await this._preferencesService.getOrSetDefault(
                    DESIRED_CODEC_CRF_KEY,
                    DESIRED_CODEC_CRF_DEFAULT_VALUE
                );

                collector.appendFfmpegOptions(['-c:v', encoder, '-crf', crf]);
            }

            const preset = await this._preferencesService.getOrSetDefault(
                DESIRED_CODEC_PRESET_KEY,
                DESIRED_CODEC_PRESET_DEFAULT_VALUE
            );
            collector.appendFfmpegOptions(['-preset', preset]);
        }
        else {
            // not a video
            collector.setDelete();
        }
    }
}

module.exports = CodecPrePlugin;
