import winston from 'winston';

let logger = {};

if (process.env.NODE_ENV !== 'production') {
  logger = console;
} else {
  const consoleTransport = new winston.transports.Console({
    json: true,
    colorize: true
  });

  logger = new winston.Logger({
    transports: [consoleTransport],
  });
}

const logExport = logger;
export default logExport;
