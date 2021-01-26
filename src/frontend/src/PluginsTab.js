import React, { Fragment } from 'react';
import Table from 'react-bootstrap/Table';

import IoComponent from './components/IoComponent';
import Type from './components/Type';
import TableButton from './components/TableButton';
import pluginApi from './api/plugins';

import './PluginsTab.css';

class PluginsTab extends IoComponent {
    constructor(...args) {
        super(...args);
        this.state = {
            enabledPlugins: [],
            disabledPlugins: [],
            stateChanging: [],
            failure: []
        };
    }

    componentDidMount() {
        super.componentDidMount();
        
        this.io.on('loading', this.onLoading.bind(this));
        this.io.on('loaded', this.onLoaded.bind(this));
        this.io.on('loadfail', this.onLoadFailure.bind(this));
        this.io.on('unloading', this.onUnloading.bind(this));
        this.io.on('unloaded', this.onUnloaded.bind(this));
        this.io.on('unloadfail', this.onUnloadFailure.bind(this));
        this.io.on('forcedelete', this.onForceDelete.bind(this));

        this.onFirstLoad();
    }

    async onFirstLoad() {
        const allPlugins = await pluginApi.getAllPlugins();
        if (!this.unmounted) {
            this.setState({
                enabledPlugins: allPlugins.filter(plugin => plugin.enabled),
                disabledPlugins: allPlugins.filter(plugin => !plugin.enabled)
            });
        }
    }

    async onLoading(pluginInfo) {
        this.setState(Object.assign(this.state, {
            stateChanging: this.state.stateChanging.concat([pluginInfo.id])
        }));
    }

    async onUnloading(descriptor) {
        this.setState(Object.assign(this.state, {
            stateChanging: this.state.stateChanging.concat([descriptor.id])
        }));
    }

    async onLoaded(pluginInfo) {
        this.setState(Object.assign(this.state, {
            enabledPlugins: [pluginInfo].concat(this.state.enabledPlugins.filter(plugin => plugin.id !== pluginInfo.id)),
            disabledPlugins: this.state.disabledPlugins.filter(plugin => plugin.id !== pluginInfo.id),
            stateChanging: this.state.stateChanging.filter(id => id !== pluginInfo.id)
        }));
    }

    async onUnloaded(descriptor) {
        this.setState(Object.assign(this.state, {
            enabledPlugins: this.state.enabledPlugins.filter(plugin => plugin.id !== descriptor.id),
            disabledPlugins: [descriptor].concat(this.state.disabledPlugins.filter(plugin => plugin.id !== descriptor.id)),
            stateChanging: this.state.stateChanging.filter(id => id !== descriptor.id)
        }));
    }

    async onLoadFailure(path) {
        this.setState(Object.assign(this.state, {
            failure: this.state.failure.concat([path.path])
        }));
    }

    async onUnloadFailure(descriptor) {
        this.setState(Object.assign(this.state, {
            failure: this.state.failure.concat([descriptor.path])
        }));
    }

    async onForceDelete(id) {
        const existing = this.state.enabledPlugins.find(plugin => plugin.id === id)
                      || this.state.disabledPlugins.find(plugin => plugin.id === id);
        
        this.setState(Object.assign(this.state, {
            enabledPlugins: this.state.enabledPlugins.filter(plugin => plugin.id !== id),
            disabledPlugins: this.state.disabledPlugins.filter(plugin => plugin.id !== id),
            stateChanging: this.state.stateChanging.filter(plugin => plugin !== id),
            failure: this.state.failure.filter(path => !existing || existing.path !== path)
        }));
    }

    renderOptions(plugin, disableOptions) {
        if (disableOptions) {
            if (disableOptions === 'table-secondary') {
                return plugin.enabled ? (<i>Unloading</i>) : (<i>Loading</i>);
            }
            else {
                const removePlugin = () => pluginApi.removePlugin(plugin.id);
                return (
                    <Fragment>
                        <b>Load Failure</b>
                        <br />
                        <TableButton onClick={removePlugin} variant='danger'>Remove</TableButton>
                    </Fragment>
                );
            }
        }
        else if (plugin.enabled) {
            const disablePlugin = () => pluginApi.disablePlugin(plugin.id);
            return (
                <TableButton onClick={disablePlugin} variant='danger'>Disable</TableButton>
            );
        }
        else {
            const enablePlugin = () => pluginApi.enablePlugin(plugin.id);
            return (
                <TableButton onClick={enablePlugin}>Enable</TableButton>
            );
        }
    }

    renderPlugin(plugin) {
        let rowColour;
        if (this.state.stateChanging.includes(plugin.id)) {
            rowColour = 'table-secondary';
        }
        else if (this.state.failure.includes(plugin.path)) {
            rowColour = 'table-danger';
        }
        else {
            rowColour = void(0);
        }

        return (
            <tr key={plugin.id} className={rowColour}>
                <td>{plugin.id}</td>
                <td>{plugin.name}</td>
                <td>{plugin.version}</td>
                <td>
                {
                    (plugin.types || []).map(
                        type => (<Type key={type}>{type}</Type>)
                    )
                }
                </td>
                <td>{plugin.description}</td>
                <td>{plugin.path}</td>
                <td className="noWrap">{this.renderOptions(plugin, rowColour)}</td>
            </tr>
        );
    }

    render() {
        return (
            <Fragment>
                <h4>Enabled Plugins</h4>
                <Table hover>
                    <thead>
                        <tr className="noWrap">
                            <th>Plugin ID</th>
                            <th>Name</th>
                            <th>Version</th>
                            <th>Types</th>
                            <th>Description</th>
                            <th>Path</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.enabledPlugins
                                .map(plugin => this.renderPlugin(plugin))
                        }
                    </tbody>
                </Table>
                <br/>
                <h4>Disabled Plugins</h4>
                <Table hover>
                    <thead>
                        <tr className="noWrap">
                            <th>Plugin ID</th>
                            <th>Name</th>
                            <th>Version</th>
                            <th>Types</th>
                            <th>Description</th>
                            <th>Path</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.disabledPlugins
                                .map(plugin => this.renderPlugin(plugin))
                        }
                    </tbody>
                </Table>
            </Fragment>
        );
    }
}

export default PluginsTab;
