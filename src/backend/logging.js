const { createLogger, format, transports } = require('winston');

let setupComplete = false;
module.exports = () => {
    if (setupComplete) {
        return global.LOG;
    }

    const logger = createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:MM:SS'
            }),
            format.splat(),
            format.colorize({ all: false }),
            format.printf(info => {
                if (typeof(info.message) !== 'string') {
                    try {
                        info.message = JSON.stringify(info.message, null, 4);
                    } catch(e) {}
                }
                return `[${info.timestamp}] [${info.level}] ${info.message}`;
            }),
        ),
        transports: [
            new transports.Console()
        ]
    });

    process.on('unhandledRejection', reason => {
        LOG.error(reason.stack);
    });

    process.on('uncaughtException', reason => {
        LOG.error(reason.stack);
    });
    
    module.exports = logger;
    global.LOG = logger;
    setupComplete = true;    
};
