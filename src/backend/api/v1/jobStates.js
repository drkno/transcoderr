module.exports = serviceFactory => {
    const jobsService = serviceFactory.getJobsService();
    return async(_, res) => {
        const results = await jobsService.getPossibleJobStates();
        const jsonResponse = {};
        for (let result of results) {
            jsonResponse[result.getId()] = result;
        }
        res.json(jsonResponse);
    };
};
