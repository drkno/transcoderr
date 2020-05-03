import React from 'react';
import JobState from './JobState';
import DateComponent from './Date';
import AbortRerunButton from './AbortRerunButton';
import PluginModal from './PluginModal';

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
        <td className="noWrap">
            <AbortRerunButton jobId={job.jobId} state={job.state} />
            &nbsp;
            <PluginModal plugins={job.plugins} />
        </td>
    </tr>
);

export default Job;
