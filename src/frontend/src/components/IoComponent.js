import { Component } from 'react';
import getSocketIoListener from '../utils/socketIo';

class IoComponent extends Component {
    constructor(...args) {
        super(...args);
        this.io = getSocketIoListener();
        this.unmounted = true;
    }

    componentDidMount() {
        this.unmounted = false;
    }

    componentWillUnmount() {
        this.unmounted = true;
        this.io.removeAllListeners();
    }
}

export default IoComponent;
