const { promisify } = require('util');
const express = require('express');
const { json } = require('body-parser');
const v1Routes = require('./api/v1');
const setupLogging = require('./logging');
const serviceFactory = require('./service');

(async() => {
    const preferencesService = serviceFactory.getPreferencesService();

    setupLogging(preferencesService.getLogLevel());
    
    const app = express();

    const listen = promisify(app.listen.bind(app));
    const port = preferencesService.getPort();
    
    app.use(json());
    app.use('/api/v1', v1Routes(serviceFactory));

    await listen(port);
    LOG.info(`Webserver started on port ${port}`);
})();
