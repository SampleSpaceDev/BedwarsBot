const winston = require("winston");
const { format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

// Define a custom log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Create a Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: combine(
        colorize({ all: true }), // Enable colorisation of log messages
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss', // Custom timestamp format
        }),
        logFormat
    ),
    transports: [
        new transports.Console(), // Log to the console
        // new transports.File({ filename: 'logs.log' }) // Log to a file
    ]
});

export default logger;
