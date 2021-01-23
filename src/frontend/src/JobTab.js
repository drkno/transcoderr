import React from 'react';
import Table from 'react-bootstrap/Table';

import TabComponent from './components/TabComponent';
import Job from './components/Job';
import jobsApi from './api/jobs';
import eventDebouncer from './utils/eventDebouncer';
import mergeStates from './utils/mergeStates';

import './JobTab.css';

class JobTab extends TabComponent {
    constructor(...args) {
        super('Jobs', ...args);
        this.state = {
            jobs: []
        };
        this.onNewJob = this.onNewJob.bind(this);
        this.onJobUpdated = this.onJobUpdated.bind(this);
        this.onJobStateChange = eventDebouncer(this.onJobStateChange.bind(this), 200);
    }

    componentDidMount() {
        super.componentDidMount();
        this.io.on('new-job', this.onNewJob);
        this.io.on('job-updated', this.onJobUpdated);

        this.onFirstLoad();
    }

    async onFirstLoad() {
        const allJobs = await jobsApi.getAllJobs();
        if (!this.unmounted) {
            this.setState({
                jobs: allJobs
            });
        }
    }

    onNewJob(newJob) {
        this.setState({
            jobs: this.state.jobs.concat(newJob)
        });
    }

    onJobUpdated(jobChange) {
        switch(jobChange.changeType) {
            case 'job-state': return this.onJobStateChange(jobChange);
            case 'job-plugin-state': return this.onJobPluginStateChange(jobChange);
            default: throw new Error('Unknown event type');
        }
    }

    onJobStateChange(jobChanges) {
        const jobs = this.state.jobs.slice();
        for (let jobChange of jobChanges) {
            const newJob = jobChange.job;
            const newJobVersion = jobChange._sequenceNumber;
            newJob._sequenceNumber = newJobVersion;

            const index = jobs.findIndex(job => job.jobId === newJob.jobId);
            if (index < 0) {
                jobs.push(newJob);
            }
            else {
                const oldJob = jobs[index];
                const oldJobVersion = oldJob._sequenceNumber;

                const job = mergeStates(oldJob, oldJobVersion, newJob, newJobVersion);
                jobs[index] = job;
            }
        }

        this.setState({ jobs });
    }

    onJobPluginStateChange(change) {
        // todo
    }

    renderTab() {
        const sortedJobs = this.state.jobs.sort((a, b) =>
            new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime());
        return (
            <Table hover>
                <thead>
                    <tr className="noWrap">
                        <th>Job ID</th>
                        <th>State</th>
                        <th>File</th>
                        <th>Last Run</th>
                        <th>Last Success</th>
                        <th>Last Failure</th>
                        <th>Run Count</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        sortedJobs.map(job => (
                            <Job key={job.jobId} job={job} />
                        ))
                    }
                </tbody>
            </Table>
        );
    }
}

export default JobTab;
