const { Router } = require('express');
const sonarr = require('./sonarr');
const radarr = require('./radarr');
const manual = require('./manual');
const jobs = require('./jobs');

module.exports = serviceFactory => {
    const apiRouter = Router();
    
    apiRouter.post('/sonarr', sonarr(serviceFactory));
    apiRouter.post('/radarr', radarr(serviceFactory));
    apiRouter.post('/manual', manual(serviceFactory));

    apiRouter.get('/jobs', jobs(serviceFactory));

    return apiRouter;
};
