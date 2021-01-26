const NodeEventEmitter = require('events');

class EventEmitter extends NodeEventEmitter {
    emit(event, ...args) {
        super.emit('*', event, ...args);
        super.emit(event, ...args);
    }
}

module.exports = EventEmitter;
