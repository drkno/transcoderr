const { Router } = require('express');
const healthcheck = require('./healthcheck');
const sonarr = require('./sonarr');
const radarr = require('./radarr');
const manual = require('./manual');
const jobs = require('./jobs');
const jobStates = require('./jobStates');

module.exports = serviceFactory => {
    const apiRouter = Router();

    apiRouter.get('/healthcheck', healthcheck(serviceFactory));
    
    apiRouter.post('/sonarr', sonarr(serviceFactory));
    apiRouter.post('/radarr', radarr(serviceFactory));
    apiRouter.post('/manual', manual(serviceFactory));

    apiRouter.use('/job', jobs(serviceFactory));
    apiRouter.get('/jobStates', jobStates(serviceFactory));

    return apiRouter;
};
