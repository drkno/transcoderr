import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
import socketio from 'socket.io-client';

import Job from './components/Job';
import getAllJobsApi from './api/jobs';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

class App extends Component {
    constructor() {
        super();
        this.unmounted = true;
        this.state = {
            jobs: []
        };
        this.onNewJob = this.onNewJob.bind(this);
        this.onJobUpdated = this.onJobUpdated.bind(this);
    }

    componentDidMount() {
        this.unmounted = false;
        this._io = socketio({
            path: '/api/ws'
        });

        this._io.on('new-job', this.onNewJob);
        this._io.on('job-updated', this.onJobUpdated);

        this.onFirstLoad();
    }

    componentWillUnmount() {
        this.unmounted = true;
        this._io.removeAllListeners();
        this._io.disconnect();
        this._io = null;
    }

    async onFirstLoad() {
        const allJobs = await getAllJobsApi();
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
        console.log(jobChange);
        if (jobChange.changeType !== 'job-state') {
            return;
        }
        const index = this.state.jobs.findIndex(job => job.jobId === jobChange.job.jobId);
        const item = this.state.jobs[index];
        if (item._sequenceNumber && item._sequenceNumber >= jobChange._sequenceNumber) {
            console.log('Ignorning update');
            return;
        }
        console.log('Update accepted');
        const begin = this.state.jobs.slice(0, index);
        const end = this.state.jobs.slice(index + 1, this.state.jobs.length);
        this.setState({
            jobs: begin.concat(jobChange.job).concat(end)
        });
    }

    render() {
        return (
            <div className="App">
                <Table hover>
                    <thead>
                        <tr>
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
                            this.state.jobs.map(job => (
                                <Job key={job.jobId} job={job} />
                            ))
                        }
                    </tbody>
                </Table>
            </div>
        );
    }
}

export default App;
