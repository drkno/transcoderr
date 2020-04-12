const { deserialize, serialize } = require('v8');

class Collector {
    _clone(obj) {
        return deserialize(serialize(obj));
    }
}

module.exports = Collector;
