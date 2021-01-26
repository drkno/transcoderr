const Collector = require('./base');

class ExecCollector extends Collector {
    constructor(filterCollector) {
        super();
        this._metaData = filterCollector.getMetaData();
        this._ffmpegOptions = filterCollector.getFfmpegOptions();
        this._outputPath = '';
        this._container = filterCollector.getContainer();
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

module.exports = ExecCollector;
