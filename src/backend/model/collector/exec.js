const Collector = require('./base');

class ExecCollector extends Collector {
    constructor(filterCollector) {
        super();
        this._metaData = filterCollector.getMetaData();
        this._ffmpegOptions = filterCollector.getFfmpegOptions();
    }

    getMetaData() {
        return this._clone(this._metaData);
    }

    getFfmpegOptions() {
        return this._clone(this._ffmpegOptions);
    }

    shouldExec() {
        return true;
    }
}

module.exports = ExecCollector;
