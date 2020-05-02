const { Router } = require('express');
const JobState = require('../../model/job-state');

class JobsApi {
    constructor(router, jobsService, executorService) {
        this._jobsService = jobsService;
        this._executorService = executorService;

        router.get('/all', this.getAll.bind(this));
        router.delete('/:jobId', this.abortJob.bind(this));
        router.post('/:jobId', this.rerun.bind(this));
    }

    async getAll(_, res) {
        const jobs = await this._jobsService.getAllJobs();
        res.json(jobs);
    }

    async abortJob(req, res) {
        const job = await this._jobsService.getJob(req.params.jobId);
        await this._jobsService.updateJobState(job, JobState.ABORT);
        res.json(job);
    }

    async rerun(req, res) {
        res.json({});
        const job = await this._jobsService.getJob(req.params.jobId);
        await this._executorService.execute(job);
    }
}

module.exports = serviceFactory => {
    const apiRouter = Router();
    const jobsService = serviceFactory.getJobsService();
    const executorService = serviceFactory.getExecutorService();
    new JobsApi(apiRouter, jobsService, executorService);
    return apiRouter;
};
