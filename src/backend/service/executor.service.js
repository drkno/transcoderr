const EventEmitter = require('events');
const JobState = require('../model/job-state');
const JobScriptState = require('../model/job-script-state');
const { MetaCollector, PreCollector, FilterCollector, ExecCollector, PostCollector } = require('../model/collector');

class ExecutorService extends EventEmitter {
    constructor(scriptsService, jobsService) {
        super();
        this._jobsService = jobsService;
        this._scriptsService = scriptsService;
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

    async execute(files) {
        if (!Array.isArray(files)) {
            files = [files];
        }

        const newJobs = (await this._jobsService.getJobs(files))
            .map(job => {
                this._inProgressJobs.push(job);
                return job;
            });

        const metaScripts = await this._scriptsService.getMetaScripts();
        const preScripts = await this._scriptsService.getPreScripts();
        const filterScripts = await this._scriptsService.getFilterScripts();
        const execScripts = await this._scriptsService.getExecScripts();
        const postScripts = await this._scriptsService.getPostScripts();

        const tasks = newJobs.map(async(job) => {
            const metaCollector = new MetaCollector(job.getFile());
            await this._executeState(JobState.META, job, metaScripts, metaCollector);

            const preCollector = new PreCollector(metaCollector);
            await this._executeState(JobState.PRE, job, preScripts, preCollector);

            const filterCollector = new FilterCollector(preCollector);
            await this._executeState(JobState.FILTER, job, filterScripts, filterCollector);

            let postCollector;
            if (filterCollector.shouldExec()) {
                const execCollector = new ExecCollector(filterCollector);
                await this._executeState(JobState.EXEC, job, execScripts, execCollector);

                postCollector = new PostCollector(execCollector);
            } else {
                postCollector = new PostCollector(filterCollector);
            }

            await this._executeState(JobState.POST, job, postScripts, postCollector);

            await this._jobsService.updateJobState(job, JobState.COMPLETE);
            const index = this._inProgressJobs.indexOf(job);
            if (index >= 0) {
                this._inProgressJobs.splice(index, 1);
            }
            return job;
        });

        return await Promise.all(tasks);
    }

    async _executeState(jobState, job, scripts, collector) {
        if (job.isAborted() || scripts.length === 0) {
            return;
        }
        await this._jobsService.updateJobState(job, jobState);

        return Promise.all(scripts.map(async(script) => {
            if (job.isAborted()) {
                return;
            }

            const scriptInfo = await script.getScriptInfo();
            const scriptPhase = `${scriptInfo.name}@${scriptInfo.version}:${jobState}`;
            try {
                await this._jobsService.updateScriptExecutionState(job, scriptPhase, JobScriptState.STARTED);

                const mainMethodName = jobState + 'main';
                const sandboxedScript = await script.getScript();
                if (sandboxedScript[mainMethodName]) {
                    await sandboxedScript[mainMethodName](collector);
                } else {
                    throw new Error(`'${scriptPhase}' is of type '${jobState}' but does not have method '${mainMethodName}'.`);
                }
                await this._jobsService.updateScriptExecutionState(job, scriptPhase, JobScriptState.SUCCESS);
            } catch(e) {
                await this._jobsService.updateScriptExecutionState(job, scriptPhase, JobScriptState.FAILED, e);
                if (!scriptInfo.failureSafe) {
                    await this._jobsService.updateJobState(job, JobState.ABORT);
                }
            }
        }));
    }
}

module.exports = ExecutorService;
