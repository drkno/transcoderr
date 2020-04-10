const { promisify } = require('util');
const express = require('express');
const setupLogging = require('./logging');

const app = express();

const listen = promisify(app.listen.bind(app));
const port = process.env.PORT || 4300;

(async() => {
    await setupLogging(process.env.LOG_LEVEL || 'info');
    await listen(port);
    LOG.info(`Webserver started on port ${port}`);
})();
