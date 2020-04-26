import React from 'react';

export default ({ dateTime }) => (
    <>
        {dateTime ? (new Date(dateTime)).toLocaleString() : 'Never'}
    </>
);
