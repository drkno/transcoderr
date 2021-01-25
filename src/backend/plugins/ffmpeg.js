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
        const editedFfmpegArgs = ['-hide_banner', '-i', fullPath].concat(ffmpegArgs).concat([newPath]);

        LOG.info(`Running 'ffmpeg ${editedFfmpegArgs.map(arg => arg.indexOf(' ') >=0 ? `"${arg}"` : arg).join(' ')}'`);

        const childProcess = new ChildProcess('ffmpeg', editedFfmpegArgs);
        const stdout = await childProcess.getStdOut();

        const exitCode = await childProcess.getExitCode();

        if (exitCode !== 0) {
            LOG.info('ffmpeg returned non-zero status code: ' + exitCode);
            LOG.debug(stdout);
            throw new Error(await childProcess.getStdErr())
        }

        LOG.info('Transcoding was successful');
    }
}

module.exports = new FfmpegExecPlugin();
