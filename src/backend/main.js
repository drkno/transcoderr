const { promisify } = require('util');
const { Server } = require('http');
const express = require('express');
const socketIO = require('socket.io');
const { json } = require('body-parser');
const v1Routes = require('./api/v1');
const wsRoutes = require('./api/ws');
const setupLogging = require('./logging');
const serviceFactory = require('./service');

(async() => {
    const preferencesService = serviceFactory.getPreferencesService();

    setupLogging(preferencesService.getLogLevel());
    
    const app = express();
    const server = Server(app);
    const io = socketIO(server);

    const listen = promisify(server.listen.bind(server));
    const port = preferencesService.getPort();
    
    app.use(json());
    app.use('/api/v1', v1Routes(serviceFactory));
    
    io.path('/api/ws');
    wsRoutes(io, serviceFactory);

    await listen(port);
    LOG.info(`Webserver started on port ${port}`);
})();
