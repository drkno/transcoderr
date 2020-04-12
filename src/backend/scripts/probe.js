const ChildProcess = require('../utils/spawn');

class ProbeMetaScript {
    describe() {
        return {
            name: 'ffprobe',
            description: 'adds ffprobe data to events',
            version: '1.0.0',
            type: ['meta']
        };
    }

    async premain(collector) {
        const file = collector.getMetaDataItem('file');
        collector.appendMetaData('probe', await this._ffprobe(file));
    }

    async _ffprobe(file) {
        const childProcess = new ChildProcess('ffprobe',
            ['-hide_banner', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file]
        );
        const stdOut = await childProcess.getStdOut();
        return JSON.parse(stdOut);
    }
}

module.exports = new ProbeMetaScript();
