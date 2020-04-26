module.exports = serviceFactory => {
    const jobsService = serviceFactory.getJobsService();
    return async(_, res) => {
        const jobs = await jobsService.getAllJobs();
        res.json(jobs);
    };
};
