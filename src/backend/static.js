const { static } = require('express');
const { resolve } = require('path');

const uidir = resolve(__dirname, 'ui');
const index = resolve(uidir, 'index.html');

module.exports = app => {
    app.use(static(uidir));
    app.get('*', (_, res) => res.sendFile(index));
};
