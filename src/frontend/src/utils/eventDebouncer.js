class Debounce {
    constructor(eventHandler, timeout) {
        this._eventHandler = eventHandler;
        this._timeout = timeout;

        this._timer = null;
        this._eventQueue = [];
    }

    debounce(event) {
        if (this._timer === null) {
            this._timer = setTimeout(this._forwardEvents.bind(this), this._timeout);
        }
        this._eventQueue.push(event);
    }

    _forwardEvents() {
        const eventQueue = this._eventQueue;
        this._timer = null;
        this._eventQueue = [];
        this._eventHandler(eventQueue);
    }
}

export default (eventHandler, timeout) => {
    const debouncer = new Debounce(eventHandler, timeout)
    return event => debouncer.debounce(event);
};
