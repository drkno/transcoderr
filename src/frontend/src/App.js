import React from 'react';
import Tabs from 'react-bootstrap/Tabs';

import JobTab from './JobTab';
import PluginsTab from './PluginsTab';

const App = () => (
    <div className="App">
        <Tabs defaultActiveKey='Jobs'>
            <JobTab />
            <PluginsTab />
        </Tabs>
    </div>
);

export default App;
