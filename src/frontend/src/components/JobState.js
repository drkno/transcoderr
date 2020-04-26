import React from 'react';
import Badge from 'react-bootstrap/Badge';

const JobState = ({ state, runCount }) => {
    let variant;
    if (runCount === 0) {
        variant = 'primary';
    } else if (state.failure) {
        variant = 'danger';
    } else if (state.final) {
        variant = 'success';
    } else {
        variant = 'warning';
    }
    return (
        <Badge variant={variant}>{state.name}</Badge>
    );
};

export default JobState;
