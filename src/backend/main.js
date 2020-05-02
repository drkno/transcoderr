const { promisify } = require('util');
const { Server } = require('http');
const express = require('express');
const socketIO = require('socket.io');
const { json } = require('body-parser');
const v1Routes = require('./api/v1');
const wsRoutes = require('./api/ws');
const uiRoutes = require('./static');
const setupLogging = require('./logging');
const serviceFactory = require('./service');

const loggingMiddleware = (req, _, next) => {
    const body = req.body && Object.keys(req.body).length > 0
        ? ' ' + JSON.stringify(req.body, null, 4)
        : '';
    LOG.info(`[${req.method}] ${req.url}${body}`);
    next();
};

(async() => {
    const preferencesService = serviceFactory.getPreferencesService();

    setupLogging(preferencesService.getLogLevel());
    
    const app = express();
    const server = Server(app);
    const io = socketIO(server, {
        path: '/api/ws'
    });

    const listen = promisify(server.listen.bind(server));
    const port = preferencesService.getPort();
    
    app.use(json());
    app.use(loggingMiddleware);

    app.use('/api/v1', v1Routes(serviceFactory));
    wsRoutes(io, serviceFactory);
    uiRoutes(app);

    await listen(port);
    LOG.info(`Webserver started on port ${port}`);
})();
