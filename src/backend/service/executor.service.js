const EventEmitter = require('events');
const JobRecord = require('../model/job-record');
const { MetaCollector, PreCollector, FilterCollector, ExecCollector, PostCollector } = require('../model/collector');

class ExecutorService extends EventEmitter {
    constructor(scriptsService) {
        super();
        this._scriptsService = scriptsService;
        this._jobRecord = [];
        this._inProgressJobs = [];
    }

    abort(jobId) {
        if (jobId) {
            this._inProgressJobs.filter(job => job.getJobId() === jobId)
                .forEach(job => job.abort());
        } else {
            this._inProgressJobs.forEach(job => job.abort());
        }
    }

    getJobRecord() {
        return this._jobRecord;
    }

    async execute(files) {
        if (!Array.isArray(files)) {
            files = [files];
        }

        const newJobs = (Array.isArray(files) ? files : [files])
            .map(file => new JobRecord(file))
            .map(job => {
                this._jobRecord.push(job);
                this._inProgressJobs.push(job);
                job.on('jobChanged', change => {
                    setImmediate(() => this.emit('jobChanged', change));
                });
                job.emitCreatedEvent();
                return job;
            });

        const metaScripts = await this._scriptsService.getMetaScripts();
        const preScripts = await this._scriptsService.getPreScripts();
        const filterScripts = await this._scriptsService.getFilterScripts();
        const execScripts = await this._scriptsService.getExecScripts();
        const postScripts = await this._scriptsService.getPostScripts();

        const tasks = newJobs.map(async(job) => {
            const metaCollector = new MetaCollector(job.getFile());
            await this._executePhase('meta', job, metaScripts, metaCollector);

            const preCollector = new PreCollector(metaCollector);
            await this._executePhase('pre', job, preScripts, preCollector);

            const filterCollector = new FilterCollector(preCollector);
            await this._executePhase('filter', job, filterScripts, filterCollector);

            let postCollector;
            if (filterCollector.shouldExec()) {
                const execCollector = new ExecCollector(filterCollector);
                await this._executePhase('exec', job, execScripts, execCollector);

                postCollector = new PostCollector(execCollector);
            } else {
                postCollector = new PostCollector(filterCollector);
            }

            await this._executePhase('post', job, postScripts, postCollector);

            job.setState('complete');
            const index = this._inProgressJobs.indexOf(job);
            if (index >= 0) {
                this._inProgressJobs.splice(index, 1);
            }
            return job;
        });

        return await Promise.all(tasks);
    }

    async _executePhase(phaseName, job, scripts, collector) {
        if (job.isAborted() || scripts.length === 0) {
            return;
        }
        job.setState(phaseName);

        return Promise.all(scripts.map(async(script) => {
            if (job.isAborted()) {
                return;
            }

            const scriptInfo = await script.getScriptInfo();
            const scriptPhase = `${scriptInfo.name}@${scriptInfo.version}:${phaseName}`;
            try {
                job.setScriptState(scriptPhase, 'started');

                const mainMethodName = phaseName + 'main';
                const sandboxedScript = await script.getScript();
                if (sandboxedScript[mainMethodName]) {
                    await sandboxedScript[mainMethodName](collector);
                } else {
                    throw new Error(`'${scriptPhase}' is of type '${phaseName}' but does not have method '${mainMethodName}'.`);
                }
                job.setScriptState(scriptPhase, 'success');
            } catch(e) {
                job.setScriptState(scriptPhase, 'failure', e);
                if (!scriptInfo.failureSafe) {
                    job.abort();
                }
            }
        }));
    }
}

module.exports = ExecutorService;
