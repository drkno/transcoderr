const EventEmitter = require('events');
const { randomBytes } = require('crypto');

class JobRecord extends EventEmitter {
    constructor(file) {
        this.file = file;
        this.jobId = this._generateJobId();
        this.state = 'new';
        this.scripts = {};
    }

    getJobId() {
        return this.jobId;
    }

    getFile() {
        return this.file;
    }

    getState() {
        return this.state;
    }

    isAborted() {
        return this.state === 'abort';
    }

    abort() {
        if (!this.isAborted()) {
            this.state = 'abort';
            LOG.warn(`Job ${this.getJobId()} aborted`);
            this._jobChanged('job-state', 'state', 'abort');
        }
    }

    setState(newState) {
        if (!this.isAborted()) {
            this.state = newState;
            LOG.info(`Job ${this.getJobId()} changed state to '${newState}'`);
            this._jobChanged('job-state', 'state', newState);
        }
    }

    setScriptState(script, state, err) {
        this.state.scripts[script] = {
            state,
            err
        };
        (err ? LOG.info : LOG.error)(`Job ${this.getJobId()} - ${script} changed state to '${state}'${err ? ' ' + err.stack : void(0)}`);
        this._jobChanged('script-state', 'state', state, err);
    }

    emitCreatedEvent() {
        this._jobChanged('job-state', 'state', 'new');
        LOG.info(`New job ${job.getJobId()} ('${job.getFile()}') created`);
    }
    
    _generateJobId() {
        return randomBytes(16).toString("hex");
    }

    _jobChanged(changeType, changeKey, changeValue, errors) {
        this.emit('jobChanged', {
            jobId: this.getJobId(),
            file: this.getFile(),
            changeType,
            changeKey,
            changeValue,
            errors
        });
    }

    toString() {
        return this.getJobId();
    }
}

module.exports = JobRecord;
