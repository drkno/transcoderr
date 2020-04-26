import React from 'react';
import JobState from './JobState';
import DateComponent from './Date';
import AbortRerunButton from './AbortRerunButton';

const Job = ({ job }) => (
    <tr>
        <td>{job.jobId}</td>
        <td>
            <JobState state={job.state} runCount={job.runCount} />
        </td>
        <td>{job.file}</td>
        <td>
            <DateComponent dateTime={job.lastRun} />
        </td>
        <td>
            <DateComponent dateTime={job.lastSuccess} />
        </td>
        <td>
            <DateComponent dateTime={job.lastFailure} />
        </td>
        <td>{job.runCount}</td>
        <td>
            <AbortRerunButton jobId={job.id} state={job.state} />
        </td>
    </tr>
);

export default Job;
