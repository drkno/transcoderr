import React from 'react';

const zeroPad = num => {
    if (num < 10) {
        return '0' + num;
    }
    return num;
};

const formatDate = dateTime => {
    if (!dateTime) {
        return 'Never';
    }
    const jsDate = new Date(dateTime);
    const formattedDate = `${jsDate.getFullYear()}-${zeroPad(jsDate.getMonth() + 1)}-${zeroPad(jsDate.getDate())}`;
    const formattedTime = `${zeroPad(jsDate.getHours())}:${zeroPad(jsDate.getMinutes())}:${zeroPad(jsDate.getSeconds())}`;
    return formattedDate + ' ' + formattedTime;
};

export default ({ dateTime }) => (
    <>
        {formatDate(dateTime)}
    </>
);
