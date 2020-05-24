const Collector = require('./base');

class PreCollector extends Collector {
    constructor(metaCollector) {
        super();
        this._metaData = metaCollector.getAllMetaData();
        this._ffmpegOptions = [];
        this._shouldDelete = false;
    }

    getMetaData() {
        return this._clone(this._metaData);
    }

    shouldDelete() {
        return this._shouldDelete;
    }

    getFfmpegOptions() {
        return this._clone(this._ffmpegOptions);
    }

    setDelete() {
        this._shouldDelete = true;
    }

    appendFfmpegOptions(options) {
        if (!Array.isArray(options)) {
            options = [options];
        }
        this._ffmpegOptions.push(options);
    }
}

module.exports = PreCollector;
