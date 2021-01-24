import socketio from 'socket.io-client';

const socketIoConnection = socketio({
    path: '/api/ws'
});

class SocketIoListener {
    constructor(socketConnection) {
        this._socketConnection = socketConnection;
        this._listeners = {};
    }

    on(event, listener) {
        this._listeners[event] = this._listeners[event] || [];
        this._listeners[event].push(listener);
        this._socketConnection.on(event, listener);
    }

    removeAllListeners() {
        for (let eventName in this._listeners) {
            for (let listener of this._listeners[eventName]) {
                this._socketConnection.off(eventName, listener);
            }
        }
        this._listeners = {};
    }
}

const getSocketIoListener = () => {
    return new SocketIoListener(socketIoConnection);
};

export default getSocketIoListener;
