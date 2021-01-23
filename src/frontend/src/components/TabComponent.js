import React, { Component } from 'react';
import Tab from 'react-bootstrap/Tab';
import getSocketIoListener from '../utils/socketIo';

class TabComponent extends Component {
    constructor(tabName, ...args) {
        super(...args);
        this.tabName = tabName;
        this.io = getSocketIoListener();
        this.unmounted = true;
        throw new Error('hello world');
    }

    componentDidMount() {
        this.unmounted = false;
    }

    componentWillUnmount() {
        this.unmounted = true;
        this.io.removeAllListeners();
    }

    renderTab() {
        throw new Error('This should be overridden');
    }

    render() {
        console.log('here');
        return (
            <Tab eventKey={this.tabName} title={this.tabName}>
                {this.renderTab()}
            </Tab>
        );
    }
}

export default TabComponent;
