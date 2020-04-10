const { createLogger, format, transports } = require('winston');

let setupComplete = false;
module.exports = () => {
    if (setupComplete) {
        return global.LOG;
    }

    const logger = createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: format.simple(),
        transports: [
            new transports.Console()
        ]
    });
    
    module.exports = logger;
    global.LOG = logger;
    setupComplete = true;    
};
