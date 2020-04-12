const EventEmitter = require('events');
const JobRecord = require('../model/job-record');
const { MetaCollector, PreCollector, ExecCollector, PostCollector } = require('../model/collector');

class CollectorService extends EventEmitter {
    constructor(scriptsService) {
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
        const execScripts = await this._scriptsService.getExecScripts();
        const postScripts = await this._scriptsService.getPostScripts();

        const tasks = newJobs.map(async(job) => {
            const metaCollector = new MetaCollector(job.getFile());
            await this._executePhase('meta', job, metaScripts, metaCollector);

            const preCollector = new PreCollector(metaCollector);
            await this._executePhase('pre', job, preScripts, preCollector);

            const execCollector = new ExecCollector(preCollector);
            await this._executePhase('exec', job, execScripts, execCollector);

            const postCollector = new PostCollector(execCollector);
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
        if (job.isAborted()) {
            return;
        }
        job.setState(phaseName);

        return Promise.all(scripts.map(async(script) => {
            if (job.isAborted()) {
                return;
            }

            const scriptInfo = await script.getScriptInfo();
            const scriptPhase = `'${scriptInfo.name}@${scriptInfo.version}':${phaseName}`;
            try {
                job.setScriptState(scriptPhase, 'started');
                script.getScript()[phaseName + 'main'](collector);
                job.setScriptState(scriptPhase, 'success');
            } catch(e) {
                job.setScriptState(scriptPhase, 'failure', e);
            }
        }));
    }
}

module.exports = CollectorService;
