const ChildProcess = require('../utils/spawn');

class ProbeMetaPlugin {
    describe() {
        return {
            name: 'ffprobe',
            description: 'adds ffprobe data to events',
            version: '1.0.0',
            types: ['meta']
        };
    }

    async metamain(collector) {
        const file = collector.getMetaDataItem('file');
        const probeResults = await this._ffprobe(file);
        if (Object.keys(probeResults).length === 0) {
            throw new Error('ffprobe returned no data');
        }
        collector.appendMetaData('probe', probeResults);
    }

    async _ffprobe(file) {
        const childProcess = new ChildProcess('ffprobe',
            ['-hide_banner', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file]
        );
        const stdOut = await childProcess.getStdOut();
        return JSON.parse(stdOut);
    }
}

module.exports = new ProbeMetaPlugin();
