import React from 'react';
import Table from 'react-bootstrap/Table';

import TabComponent from './components/TabComponent';

import './PluginsTab.css';

class PluginsTab extends TabComponent {
    constructor(...args) {
        super('Plugins', ...args);
        this.state = {
        };
    }

    componentDidMount() {
        super.componentDidMount();

        this.onFirstLoad();
    }

    async onFirstLoad() {
        // const allJobs = await jobsApi.getAllJobs();
        // if (!this.unmounted) {
        //     this.setState({
        //         jobs: allJobs
        //     });
        // }
    }

    renderTab() {
        console.log('jere');
        return (
            <>
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
                            <th>Failure Safe</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
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
                            <th>Failure Safe</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </Table>
            </>
        );
    }
}

export default PluginsTab;
