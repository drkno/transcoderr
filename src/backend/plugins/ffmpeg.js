const ChildProcess = require('../utils/spawn');

class FfmpegExecPlugin {
    describe() {
        return {
            name: 'ffmpeg',
            description: 'execute ffmpeg',
            version: '1.0.0',
            types: ['exec']
        };
    }

    async execmain(collector) {
        const ffmpegArgs = collector.getFfmpegOptions();
        const childProcess = new ChildProcess('ffmpeg',
            ['-hide_banner'].concat(ffmpegArgs)
        );
        await childProcess.getStdOut();
    }
}

module.exports = new FfmpegExecPlugin();
