const Collector = require('./base');

class PostCollector extends Collector {
    constructor(execOrFilterCollector) {
        super();
        this._metaData = execOrFilterCollector.getMetaData();
        this._didExec = execOrFilterCollector.shouldExec();
        this._ffmpegOptions = execOrFilterCollector.getFfmpegOptions();
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
}

module.exports = PostCollector;
