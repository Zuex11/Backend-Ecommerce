const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '..', 'log');
fs.mkdirSync(logDir, { recursive: true });

const adminFilter = format((info) => {
  return info.action === 'admin' ? info : false;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'dev' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'DD-MM-YYYYHH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp}
            | ${level.toUpperCase()}| ${message} ${stack ? `\n${stack}` : ''}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logDir, 'combined.log') }),
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({
      filename: path.join(logDir, 'admin.log'),
      format: format.combine(adminFilter(), format.timestamp(), format.json()),
    }),
  ],
});
module.exports = logger;
