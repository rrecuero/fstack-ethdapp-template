import * as Winston from 'winston';
import WinstonLoggy from 'winston-loggly'; // eslint-disable-line
import { config } from 'config';
import os from 'os';
import moment from 'moment';

const logglyConfig = config.get('Loggly');
const meta = {
  environment: process.env.NODE_ENV || 'local',
  machineName: os.hostname(),
  pid: process.pid,
};

// Singleton
let instance = null;

function getUtc() {
  return moment.utc().toDate().toISOString();
}

// TODO: refactoring this class later
export default class Logger {
  constructor() {
    if (!instance) {
      let tags = 'Test';
      if (process.env.LOGGER_TAG === 'pipeline') {
        tags = 'Pipeline';
      }
      if (process.env.LOGGER_TAG === 'api') {
        tags = 'Api';
      }
      if (process.env.LOGGER_TAG === 'service') {
        tags = 'Service';
      }

      this.winston = new Winston.Logger();
      this.winston.add(Winston.transports.Loggly, {
        inputToken: logglyConfig.token,
        subdomain: logglyConfig.subdomain,
        tags: [tags],
        json: true
      });
      this.winston.add(Winston.transports.Console);
      this.winston.level = 'debug';

      this.stream = {
        write: (message) => {
          this.winston.info(message);
        }
      };
      instance = this;

    }
    return instance;
  }

  disableLoggly() {
    if ('loggly' in this.winston.transports) {
      this.winston.remove(Winston.transports.Loggly);
    }
  }

  disableConsole() {
    if ('console' in this.winston.transports) {
      this.winston.remove(Winston.transports.Console);
    }
  }

  stringifyError(obj) {
    if (obj) {
      if ('err' in obj && typeof obj.err === 'object') {
        obj.err = obj.err.toString();
      }
      if ('error' in obj && typeof obj.error === 'object') {
        obj.error = obj.error.toString();
      }
    }
    return obj;
  }

  info(message, obj = null) {
    this.winston.log('info', message, Object.assign({ utc: getUtc() },
      meta, this.stringifyError(obj)));
  }

  warn(message, obj = null) {
    this.winston.log('warn', message, Object.assign({ utc: getUtc() },
      meta, this.stringifyError(obj)));
  }

  error(message, obj = null) {
    this.winston.log('error', message, Object.assign({ utc: getUtc() },
      meta, this.stringifyError(obj)));
  }

  debug(message, obj = null) {
    if (logglyConfig.debug) {
      this.winston.log('debug', message, Object.assign({ utc: getUtc() },
        meta, this.stringifyError(obj)));
    }
  }
}
