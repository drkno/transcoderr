const { promisify } = require('util');
const express = require('express');
const setupLogging = require('./logging');

const app = express();

const listen = promisify(app.listen.bind(app));
const port = process.env.PORT || 4300;

const { ScriptsService, ProbeService } = require('./service');

(async() => {
    await setupLogging(process.env.LOG_LEVEL || 'info');
    await listen(port);
    LOG.info(`Webserver started on port ${port}`);

    const scriptsService = new ScriptsService('C:\\Users\\Matthew\\Documents\\Development\\transcoderr\\src\\backend\\test');
    const probeService = new ProbeService();

    LOG.info(await probeService.ffprobe('H:\\TV Shows\\Blindspot\\Season 2\\Blindspot - [02x01] - In Night So Ransomed Rogue.mp4'));

    const scripts = await scriptsService.getAllScripts();
    const info = [
        await scripts[0].getScriptInfo(),
        await scripts[1].getScriptInfo()
    ];
    LOG.info(await scripts[0].getScript());
    LOG.info(info);
})();
