const EventEmitter = require('events');
const JobState = require('../model/job-state');
const JobPluginState = require('../model/job-plugin-state');
const { MetaCollector, PreCollector, FilterCollector, ExecCollector, PostCollector } = require('../model/collector');

class ExecutorService extends EventEmitter {
    constructor(pluginService, jobsService) {
        super();
        this._jobsService = jobsService;
        this._pluginService = pluginService;
        this._inProgressJobs = [];
    }

    async abort(jobId) {
        if (jobId) {
            await Promise.all(this._inProgressJobs
                .filter(job => job.getJobId() === jobId)
                .map(job => this._jobsService.updateJobState(job, JobState.ABORT)));
        } else {
            await Promise.all(this._inProgressJobs.map(job => this._jobsService.updateJobState(job, JobState.ABORT)));
        }
    }

    async execute(filesOrJobs) {
        if (!Array.isArray(filesOrJobs)) {
            filesOrJobs = [filesOrJobs];
        }

        let newJobs;
        if (typeof(filesOrJobs[0]) === 'string') {
            newJobs = (await this._jobsService.getJobsForFiles(filesOrJobs))
                .map(job => {
                    this._inProgressJobs.push(job);
                    return job;
                });
        } else {
            newJobs = filesOrJobs;
        }

        const metaPlugins = await this._pluginService.getMetaPlugins();
        const prePlugins = await this._pluginService.getPrePlugins();
        const filterPlugins = await this._pluginService.getFilterPlugins();
        const execPlugins = await this._pluginService.getExecPlugins();
        const postPlugins = await this._pluginService.getPostPlugins();

        const tasks = newJobs.map(async(job) => {
            if (job.isAborted()) {
                await this._jobsService.updateJobState(job, JobState.RENEW);
            }

            const metaCollector = new MetaCollector(job.getFile());
            await this._executeState(JobState.META, job, metaPlugins, metaCollector);

            const preCollector = new PreCollector(metaCollector);
            await this._executeState(JobState.PRE, job, prePlugins, preCollector);

            const filterCollector = new FilterCollector(preCollector);
            await this._executeState(JobState.FILTER, job, filterPlugins, filterCollector);

            let postCollector;
            if (filterCollector.shouldExec()) {
                const execCollector = new ExecCollector(filterCollector);
                await this._executeState(JobState.EXEC, job, execPlugins, execCollector);

                postCollector = new PostCollector(execCollector);
            } else {
                postCollector = new PostCollector(filterCollector);
            }

            await this._executeState(JobState.POST, job, postPlugins, postCollector);

            await this._jobsService.updateJobState(job, JobState.COMPLETE);
            const index = this._inProgressJobs.indexOf(job);
            if (index >= 0) {
                this._inProgressJobs.splice(index, 1);
            }
            return job;
        });

        return await Promise.all(tasks);
    }

    async _executeState(jobState, job, plugins, collector) {
        if (job.isAborted() || plugins.length === 0) {
            return;
        }
        await this._jobsService.updateJobState(job, jobState);

        return Promise.all(plugins.map(async(plugin) => {
            if (job.isAborted()) {
                return;
            }

            const pluginId = plugin.getPluginId();
            try {
                await this._jobsService.updatePluginExecutionState(job, pluginId, jobState, JobPluginState.STARTED);

                const mainMethodName = jobState + 'main';
                const sandboxedPlugin = await plugin.getPlugin();
                if (sandboxedPlugin[mainMethodName]) {
                    await sandboxedPlugin[mainMethodName](collector);
                } else {
                    throw new Error(`'${pluginId}' is of type '${jobState}' but does not have method '${mainMethodName}'.`);
                }
                await this._jobsService.updatePluginExecutionState(job, pluginId, jobState, JobPluginState.SUCCESS);
            } catch(e) {
                await this._jobsService.updatePluginExecutionState(job, pluginId, jobState, JobPluginState.FAILED, e);
                const pluginInfo = await plugin.getPluginInfo();
                if (!pluginInfo.failureSafe) {
                    await this._jobsService.updateJobState(job, JobState.ABORT);
                }
            }
        }));
    }
}

module.exports = ExecutorService;
