const EventEmitter = require('../utils/EventEmitter');
const JobState = require('../model/job-state');
const JobPluginState = require('../model/job-plugin-state');
const { MetaCollector, PreCollector, FilterCollector, ExecCollector, PostCollector } = require('../model/collector');
const sleep = require('../utils/sleep');

const PREFERENCE_MAX_PARALLEL = 'executor.max.parallel';
const PREFERENCE_MAX_PARALLEL_DEFAULT = 1;

class ExecutorService extends EventEmitter {
    constructor(pluginService, jobsService, preferencesService) {
        super();
        this._jobsService = jobsService;
        this._pluginService = pluginService;
        this._preferencesService = preferencesService;
        this._queuedJobs = [];
        this._inProgressJobs = [];

        this._queueExecutor();
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
                    return job;
                });
        } else {
            newJobs = filesOrJobs;
        }

        for (let job of newJobs) {
            if (job.getState().isFinalState() && job.getState() !== JobState.NEW) {
                await this._jobsService.updateJobState(job, JobState.RENEW);
            }
        }

        this._queuedJobs.push(...newJobs);
    }

    async _queueExecutor() {
        while(true) {
            const maxParallel = await this._preferencesService.getPreferenceForIdOrSetDefault(PREFERENCE_MAX_PARALLEL, PREFERENCE_MAX_PARALLEL_DEFAULT);
            let numSlots = Math.max(0, maxParallel - this._inProgressJobs.length);
            while(this._queuedJobs.length > 0 && numSlots > 0) {
                const job = this._queuedJobs.shift();
                this._inProgressJobs.push(job);
                this._executeQueuedItem(job)
                    .then(() => {}, () => {})
                    .finally(() => {
                        const index = this._inProgressJobs.indexOf(job);
                        if (index >= 0) {
                            this._inProgressJobs.splice(index, 1);
                        }
                    });
                numSlots = Math.max(0, maxParallel - this._inProgressJobs.length);
            }
            await sleep(5000);
        }
    }

    async _executeQueuedItem(job) {
        const metaPlugins = await this._pluginService.getMetaPlugins();
        const prePlugins = await this._pluginService.getPrePlugins();
        const filterPlugins = await this._pluginService.getFilterPlugins();
        const execPlugins = await this._pluginService.getExecPlugins();
        const postPlugins = await this._pluginService.getPostPlugins();

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
                    const didFail = await sandboxedPlugin[mainMethodName](collector);
                    if (didFail) {
                        throw new Error(`'${pluginId}' returned a failure`);
                    }
                } else {
                    throw new Error(`'${pluginId}' is of type '${jobState}' but does not have method '${mainMethodName}'.`);
                }
                await this._jobsService.updatePluginExecutionState(job, pluginId, jobState, JobPluginState.SUCCESSFUL);
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
