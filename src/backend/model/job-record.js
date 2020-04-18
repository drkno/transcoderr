const JobState = require('./job-state');

class JobRecord {
    constructor(record) {
        this.jobId = record.id;
        this.state = record.state;
        this.file = record.file;
        this.lastRun = record.lastRun;
        this.lastSuccess = record.lastSuccess;
        this.lastFailure = record.lastFailure;
        this.runCount = record.runCount;

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

    getLastRun() {
        return this.lastRun;
    }

    getLastSuccess() {
        return this.lastSuccess;
    }

    getLastFailure() {
        return this.lastFailure;
    }

    getRunCount() {
        return this.lastRun;
    }

    getScriptStatus() {
        return this.scripts;
    }

    isAborted() {
        return this.state === JobState.ABORT;
    }

    async __applyUpdatedState(record, scripts) {
        for (let key in record) {
            this[key] = record[key];
        }

        this.scripts = Object.assign(record, scripts);
    }

    toString() {
        return this.getJobId();
    }
}

module.exports = JobRecord;
