import React, { Fragment } from 'react';
import Table from 'react-bootstrap/Table';
import FormControl from 'react-bootstrap/FormControl';

import IoComponent from './components/IoComponent';
import TableButton from './components/TableButton';
import configApi from './api/config';

class ConfigTab extends IoComponent {
    constructor(...args) {
        super(...args);
        this.state = {
            config: {},
            text: ''
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.io.on('config-changed', this.onConfigChanged.bind(this));
        this.io.on('config-deleted', this.onConfigDeleted.bind(this));
        this.onFirstLoad();
    }

    async onFirstLoad() {
        const allConfigItems = await configApi.getAllConfigItems();
        if (!this.unmounted) {
            this.setState({
                config: allConfigItems
            });
        }
    }

    async onConfigChanged(configChangedEvent) {
        delete configChangedEvent._sequenceNumber;
        this.setState({
            config: Object.assign(this.state.config, configChangedEvent)
        });
    }

    async onConfigDeleted(configDeletedEvent) {
        delete this.state.config[configDeletedEvent.key];
        this.setState({
            config: this.state.config
        });
    }

    renderOptions(key, value) {
        const editConfig = () => {
            const result = prompt(`New value for '${key}'`, value);
            if (result === value) {
                return;
            }
            configApi.setKey(key, result);
        };
        const deleteConfig = () => configApi.deleteKey(key);
        return (
            <Fragment>
                <TableButton onClick={editConfig} variant='warning'>Edit</TableButton>
                &nbsp;
                <TableButton onClick={deleteConfig} variant='danger'>Delete</TableButton>
            </Fragment>
        );
    }

    renderConfigItem(configItem) {
        const [key, value] = configItem;

        return (
            <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
                <td className="noWrap">{this.renderOptions(key, value)}</td>
            </tr>
        );
    }

    render() {
        const newConfig = () => {
            const key = prompt('Key');
            if (!key) {
                return;
            }
            configApi.setKey(key, null);
        };
        const setText = value => this.setState({
            text: value
        });
        return (
            <Fragment>
                <FormControl size="lg" type="text" placeholder="Search" value={this.state.text} onChange={e => setText(e.target.value || '')} />
                <Table hover>
                    <thead>
                        <tr className="noWrap">
                            <th>Key</th>
                            <th>Value</th>
                            <th>
                                <TableButton onClick={newConfig} variant='primary'>New</TableButton>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            Object.entries(this.state.config)
                                .filter(val => val[0].includes(this.state.text) || (val[1] && val[1].toString().includes(this.state.text)))
                                .sort((a, b) => {
                                    if (a[0] < b[0]) {
                                        return -1;
                                    }
                                    if (a[0] > b[0]) {
                                      return 1;
                                    }
                                    return 0;
                                })
                                .map(configItem => this.renderConfigItem(configItem))
                        }
                    </tbody>
                </Table>
            </Fragment>
        );
    }
}

export default ConfigTab;
