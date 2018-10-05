import express from 'express';
import bodyParser from 'body-parser';
import sanitize from 'mongo-sanitize';
import { config } from 'config';
import winston from 'winston';
import compression from 'compression';
import expressWinston from 'express-winston';
import jwt from 'express-jwt';

require('winston-papertrail').Papertrail; // eslint-disable-line

const app = express();
const version = '1.0';
const port = 4000;

const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, authorization');
  next();
};

if (process.env.NODE_ENV !== 'production') {
  app.use(corsMiddleware);
}
app.use(compression);
// sanitize
const cleanMongo = (req, res, next) => {
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  next();
};
app.use(cleanMongo);

// ignore authentication on the following routes
app.use(
  jwt({ secret: config.jwt.secret }).unless({
    path: [
      '/',
      '/auth/signup',
      '/auth/login',
      '/auth/forgot-password',
      '/auth/reset-password',
    ],
  }),
);


// throw an error if a jwt is not passed in the request
app.use((err, req, res) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Missing authentication credentials.');
  }
});


// initialize our logger (in our case, winston + papertrail)
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Papertrail({
        host: config.logger.host,
        port: config.logger.port,
        level: 'error',
      }),
    ],
    meta: true,
  }),
);

function errorHandler(error, req, res, next) {
  if (error) {
    console.error('API Error ', error);
    res.status(500).send({ error: error.toString() });
    res.end();
  } else {
    next();
  }
}

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = bodyParser.json();
app.use(jsonParser);
app.use(urlencodedParser);
// Routes
require('../api/')(app, {});
// Ping route
app.get('/ping', (req, res) => {
  if (req.headers['x-forwarded-for']) {
    // this indicates the request is from nginx server
    const ips = req.headers['x-forwarded-for'].split(', ');
    res.status(200).send({ version, ips });
  } else {
    res.status(200).send({ version });
  }
});
app.use(errorHandler);

app.listen(port, () => {
  console.log('Listening');
});
