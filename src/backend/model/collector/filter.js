const Collector = require('./base');

class FilterCollector extends Collector {
    constructor(preCollector) {
        super();
        this._metaData = preCollector.getMetaData();
        this._ffmpegOptions = preCollector.getFfmpegOptions();
        this._shouldDelete = preCollector.shouldDelete();
        this._shouldExec = true;
        this._outputPath = '';
        this._container = preCollector.getContainer();
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
        return this._shouldExec && this.getFfmpegOptions().length > 0;
    }

    vetoExec() {
        this._shouldExec = false;
    }

    getOutputPath() {
        return this._outputPath;
    }

    setOutputPath(path) {
        this._outputPath = path;
    }

    getContainer() {
        return this._container;
    }
}

module.exports = FilterCollector;
