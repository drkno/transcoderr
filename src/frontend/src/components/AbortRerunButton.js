import React from 'react';
import TableButton from './TableButton';
import jobsApi from '../api/jobs';

const AbortRerunButton = ({ jobId, state }) => {
    if (state.final) {
        const onClick = () => jobsApi.rerunJob(jobId);
        return (
            <TableButton onClick={onClick} variant="secondary">Rerun</TableButton>
        );
    } else {
        const onClick = () => jobsApi.abortJob(jobId);
        return (
            <TableButton onClick={onClick} variant="danger">Abort</TableButton>
        );
    }
};

export default AbortRerunButton;
