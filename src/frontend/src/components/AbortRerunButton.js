import React from 'react';
import Button from 'react-bootstrap/Button';
import jobsApi from '../api/jobs';

const AbortRerunButton = ({ jobId, state }) => {
    if (state.final) {
        const onClick = () => jobsApi.rerunJob(jobId);
        return (
            <Button onClick={onClick} size="sm" variant="secondary">Rerun</Button>
        );
    } else {
        const onClick = () => jobsApi.abortJob(jobId);
        return (
            <Button onClick={onClick} size="sm" variant="danger">Abort</Button>
        );
    }
};

export default AbortRerunButton;
