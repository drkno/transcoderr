const Collector = require('./base');

class MetaCollector extends Collector {
    constructor(file) {
        super();
        this._metaData = {
            file
        };
    }

    appendMetaData(section, data) {
        this._metaData[section] = data;
    }

    replaceMetaData(newMetaData) {
        this._metaData = newMetaData;
    }

    getAllMetaData() {
        return clone(this._metaData);
    }

    getMetaDataItem(item) {
        return clone(this._metaData[item]);
    }
}

module.exports = MetaCollector;
