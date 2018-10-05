import winston from 'winston';
import config from '../../config';

require('winston-papertrail').Papertrail; // eslint-disable-line


let logger = {};

if (process.env.NODE_ENV !== 'production') {
  logger = console;
} else {
  const papertrailTransport = new winston.transports.Papertrail({
    host: config.logger.host,
    port: config.logger.port,
  });

  logger = new winston.Logger({
    transports: [papertrailTransport],
  });
}

const logExport = logger;
export default logExport;
