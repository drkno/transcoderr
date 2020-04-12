LOG.warn('hello from file');

exports.describe = () => {
    return {
        name: 'file name',
        description: 'file description',
        version: 'file version',
        types: ['pre']
    };
};
