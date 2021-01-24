const { dirname, basename, join } = require('path');
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
        const fullPath = collector.getMetaData().file;

        const fileName = basename(fullPath);
        const directory = dirname(fullPath);

        const newPath = join(directory, 'New - ' + fileName);

        const ffmpegArgs = collector.getFfmpegOptions();
        const childProcess = new ChildProcess('ffmpeg',
            ['-hide_banner', '-i', fullPath].concat(ffmpegArgs).concat([newPath])
        );
        const stdout = await childProcess.getStdOut();
        if (childProcess.getExitCode() !== 0) {
            LOG.info(stdout);
            throw new Error(await childProcess.getStdErr())
        }
    }
}

module.exports = new FfmpegExecPlugin();
