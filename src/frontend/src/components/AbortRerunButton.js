import React from 'react';
import Button from 'react-bootstrap/Button';

const AbortRerunButton = ({ jobId, state }) => {
    if (state.final) {
        return (
            <Button size="sm" variant="secondary">Rerun</Button>
        );
    } else {
        return (
            <Button size="sm" variant="danger">Abort</Button>
        );
    }
};

export default AbortRerunButton;
