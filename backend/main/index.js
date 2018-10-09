import express from 'express';
import bodyParser from 'body-parser';
import sanitize from 'mongo-sanitize';
import { config } from 'config';
import winston from 'winston';
import compression from 'compression';
import path from 'path';
import expressWinston from 'express-winston';
import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import UserManager from '../users/userManager';
// import jwtAuthz from 'express-jwt-authz';
// const checkScopes = jwtAuthz([ 'read:messages' ]);


const app = express();
const version = '1.0';
const port = process.env.PORT || 4000;
const userManager = new UserManager();

const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, authorization');
  next();
};

if (process.env.NODE_ENV !== 'production') {
  app.use(corsMiddleware);
}
app.use(compression());
// sanitize
const cleanMongo = (req, res, next) => {
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  next();
};
app.use(cleanMongo);

// ignore authentication on the following routes
app.use(
  jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${config.get('auth0').domain}/.well-known/jwks.json`
    }),
    // issuer: `https://${config.get('auth0').domain}`,
    audience: `https://${config.get('auth0').audience}`,
    algorithms: ['RS256']
  }).unless((req) => {
    const unprivilegedPaths = [
      '/api/ping'
    ];
    return (
      req.method === 'GET' || unprivilegedPaths.indexOf(req.originalUrl) !== -1
    );
  })
);

// initialize our logger (in our case, winston + papertrail)
app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      })
    ],
    meta: true
  }),
);

function errorHandler(error, req, res, next) {
  if (error) {
    if (error.name === 'UnauthorizedError') {
      res.status(401).send('Missing authentication credentials.');
    }
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
app.use(errorHandler);

// Priority serve any static files.
app.use(express.static(path.resolve(__dirname, '../../client/build')));

userManager.init(() => {
  // Routes
  require('../api/')(app, {});

  // Ping route
  app.get('/api/ping', (req, res) => {
    if (req.headers['x-forwarded-for']) {
      // this indicates the request is from nginx server
      const ips = req.headers['x-forwarded-for'].split(', ');
      res.status(200).send({ version, ips });
    } else {
      res.status(200).send({ version });
    }
  });

  // All remaining requests return the React app, so it can handle routing
  // and heroku can be served in a single app
  app.get('*', (request, response) => {
    response.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });

  app.listen(port, () => {
    console.log('Listening');
  });
});
