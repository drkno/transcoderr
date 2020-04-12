const Collector = require('./base');

class FilterCollector extends Collector {
    constructor(preCollector) {
        super();
        this._metaData = preCollector.getAllMetaData();
        this._ffmpegOptions = preCollector.getFfmpegOptions();
        this._shouldDelete = preCollector.shouldDelete();
        this._shouldExec = true;
    }

    shouldDelete() {
        return this._shouldDelete;
    }

    getMetaData() {
        return this._clone(this._metaData);
    }

    getFfmpegOptions() {
        return this._clone(this._ffmpegOptions);
    }

    replaceAllFfmpegOptions(newFfmpegOptions) {
        this._ffmpegOptions = newFfmpegOptions;
    }

    shouldExec() {
        return this._shouldExec;
    }

    vetoExec() {
        this._shouldExec = false;
    }
}

module.exports = FilterCollector;
