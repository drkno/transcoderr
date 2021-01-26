import React from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import JobTab from './JobTab';
import PluginsTab from './PluginsTab';
import ConfigTab from './ConfigTab';

const App = () => (
    <div className="App">
        <Tabs defaultActiveKey='Jobs'>
            <Tab title='Jobs' eventKey='Jobs'>
                <JobTab />
            </Tab>
            <Tab title='Plugins' eventKey='Plugins'>
                <PluginsTab />
            </Tab>
            <Tab title='Raw Config' eventKey='Config'>
                <ConfigTab />
            </Tab>
        </Tabs>
    </div>
);

export default App;
