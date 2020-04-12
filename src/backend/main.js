const { promisify } = require('util');
const express = require('express');
const setupLogging = require('./logging');

const app = express();

const listen = promisify(app.listen.bind(app));
const port = process.env.PORT || 4300;

const { ScriptsService, ExecutorService } = require('./service');

(async() => {
    await setupLogging(process.env.LOG_LEVEL || 'info');
    await listen(port);
    LOG.info(`Webserver started on port ${port}`);

    const scriptsService = new ScriptsService(['C:\\Users\\Matthew\\Documents\\Development\\transcoderr\\src\\backend\\scripts']);
    const executorService = new ExecutorService(scriptsService);

    LOG.info(await executorService.execute([
        "C:\\Users\\Matthew\\Documents\\logo_round.png",
        "C:\\Users\\Matthew\\Downloads\\The Mandalorian - [01x03] - Chapter 3.mkv"
    ]));
})();
