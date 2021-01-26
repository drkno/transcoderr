const Collector = require('./base');

class PostCollector extends Collector {
    constructor(execOrFilterCollector) {
        super();
        this._metaData = execOrFilterCollector.getMetaData();
        this._didExec = execOrFilterCollector.shouldExec();
        this._ffmpegOptions = execOrFilterCollector.getFfmpegOptions();
        this._outputPath = execOrFilterCollector.getOutputPath();
    }

    getMetaData() {
        return this._clone(this._metaData);
    }

    didExec() {
        return this._didExec;
    }

    getFfmpegOptions() {
        return this._clone(this._ffmpegOptions);
    }

    getOutputPath() {
        return this._outputPath;
    }
}

module.exports = PostCollector;
