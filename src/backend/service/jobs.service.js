const EventEmitter = require('events');
const JobRecord = require('../model/job-record');
const JobState = require('../model/job-state');
const JobPluginState = require('../model/job-plugin-state');

class JobsService extends EventEmitter {
    constructor(databaseService) {
        super();
        this._databaseService = databaseService;
        this.getPossibleJobStates();
    }

    async updatePluginExecutionState(job, pluginId, jobState, state, context) {
        if (context) {
            if (context instanceof Error) {
                context = context.message + '\n' + context.stack;
            }
            else if (typeof(context) !== 'string') {
                context = JSON.stringify(context);
            }
        }
        else {
            context = '';
        }

        await this._databaseService.run(`
            INSERT INTO JobExecutions (jobId, pluginId, jobState, state, context)
            VALUES (:jobId, :pluginId, :jobState, :state, :context)
            ON CONFLICT (jobId, pluginId) DO UPDATE SET
            state = :state,
            context = :context
            WHERE jobId = :jobId AND pluginId = :pluginId
        `, {
            ':jobId': job.getJobId(),
            ':pluginId': pluginId,
            ':jobState': jobState,
            ':state': state,
            ':context': context || null
        });

        job.__applyUpdatedState({}, {
            [pluginId]: {
                state,
                context
            }
        });

        if (state === JobPluginState.FAILED || state === JobPluginState.UNKNOWN) {
            LOG.error(`Job ${job.getJobId()}, plugin ID=${pluginId} - ${jobState} execution changed state to '${state}'${context ? ' - ' + (context.message || context) : ''}`);
            LOG.debug(context);
        }
        else {
            LOG.info(`Job ${job.getJobId()}, plugin ID=${pluginId} - ${jobState} execution changed state to '${state}'`);
        }

        this.emit('job-updated', {
            job,
            changeType: 'job-plugin-state',
            changeDiff: {
                pluginId,
                jobState,
                state,
                context
            }
        });

        return job;
    }

    async updateJobState(job, newState) {
        if (job.getState() === newState || (job.getState().isFinalState() && newState.isFinalState())) {
            return;
        }

        const changes = {
            state: newState
        };
        if (job.getState().isFinalState() && !changes.state.isFinalState()) {
            changes.runCount = job.getRunCount() + 1;
            changes.lastRun = new Date();
        } else if (!job.getState().isFinalState() && changes.state.isFinalState()) {
            if (changes.state.isFailureState()) {
                changes.lastFailure = job.getLastRun();
            } else {
                changes.lastSuccess = job.getLastRun();
            }
        }

        const setKeys = Object.keys(changes)
            .map(key => `${key} = :${key}`)
            .join(', ');
        const setValues = Object.keys(changes)
            .reduce((acc, curr) => (acc[':' + curr] = changes[curr], acc), {});
        setValues[':jobId'] = job.getJobId();

        await this._databaseService.run(`
                UPDATE Jobs
                SET ${setKeys}
                WHERE id = :jobId
            `, setValues);

        job.__applyUpdatedState(changes, {});

        if (newState === JobState.ABORT) {
            LOG.error(`Job ${job.getJobId()} was aborted.`);
        }
        else {
            LOG.info(`Job ${job.getJobId()} changed to state ${newState}.`);
        }

        this.emit('job-updated', {
            job,
            changeType: 'job-state',
            changeDiff: changes
        });

        return job;
    }

    async getAllJobs() {
        const jobs = await this._databaseService.all(`SELECT * FROM Jobs`);
        const executions = await this._getJobExecutions();
        return jobs.map(job => this._toJobRecord(job, executions[job.id]));
    }

    async getJob(id) {
        const job = await this._databaseService.get(`SELECT * FROM Jobs where id = :jobId`, {
            ':jobId': id
        });
        const executions = await this._getJobExecutions(id);
        return this._toJobRecord(job, executions[id]);
    }

    async getJobsForFiles(files) {
        const existingJobs = await this._getExistingJobs(files);

        const existingJobsMap = existingJobs.reduce((acc, curr) => (acc[curr.getFile()] = curr, acc), {});
        const newJobs = await this._createNewJobs(files.filter(file => !existingJobsMap[file]));

        return existingJobs.concat(newJobs);;
    }

    async getPossibleJobStates() {
        const all = JobState.all();
        if (all) {
            return all;
        }
        return (await this._databaseService.all(`SELECT * FROM JobStates`))
            .map(jobState => JobState.create(
                jobState.id,
                jobState.state,
                jobState.name,
                jobState.description,
                jobState.final,
                jobState.failure));
    }

    async _getExistingJobs(files) {
        const jobs = await this._databaseService.all(`SELECT * FROM Jobs WHERE file IN (:files)`, {
            ':files': files
        });
        const executions = await this._getJobExecutions(jobs.map(job => job.id));
        return jobs.map(job => this._toJobRecord(job, executions[job.id]));
    }

    async _getJobExecutions(id) {
        const executions = await (id
            ? this._databaseService.all(`SELECT * FROM JobExecutions WHERE jobId IN (:jobId)`, {
                ':jobId': Array.isArray(id) ? id : [id]
            })
            : this._databaseService.all(`SELECT * FROM JobExecutions`));
        const asDict = {};
        for (let exec of executions) {
            asDict[exec.jobId] = asDict[exec.jobId] || {};
            if (!asDict[exec.jobId][exec.pluginId] || asDict[exec.jobId][exec.pluginId].id < exec.id) {
                asDict[exec.jobId][exec.pluginId] = exec;
            }
        }
        return asDict;
    }

    async _createNewJobs(files) {
        return await Promise.all(files.map(file => this._createNewJob(file)));
    }

    async _createNewJob(file) {
        const result = await this._databaseService.run(`
            INSERT INTO Jobs(state, file, runCount)
            VALUES (?, ?, ?)`, ['new', file, 0]);
        
        const job = this._toJobRecord({
            id: result.lastID,
            state: 'new',
            file,
            runCount: 0,
            lastRun: null,
            lastSuccess: null,
            lastFailure: null
        });

        LOG.info(`New job ${job} created`);
        this.emit('new-job', job);

        return job;
    }

    _toJobRecord(record, plugins) {
        record.state = JobState.from(record.state);
        record.lastRun = !!record.lastRun ? new Date(record.lastRun) : null;
        record.lastSuccess = !!record.lastSuccess ? new Date(record.lastSuccess) : null;
        record.lastFailure = !!record.lastFailure ? new Date(record.lastFailure) : null;
        record.plugins = plugins || {};
        return new JobRecord(record);
    }
}

module.exports = JobsService;
