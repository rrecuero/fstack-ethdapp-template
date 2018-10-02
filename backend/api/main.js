import express from 'express';
import bodyParser from 'body-parser';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import passport from 'passport';
import sanitize from 'mongo-sanitize';
import morgan from 'morgan';
import { config } from 'config';
import async from 'async';
import fs from 'fs';
import uuid from 'node-uuid';
import expressWinston from 'express-winston';
import session from 'express-session';
import winston from 'winston';
import multer from 'multer';
import UserManager from '../users/userManager';
import * as authApi from './auth';
import * as checkoutApi from './checkout';
import * as userApi from './user';

const MongoStore = require('connect-mongo')(session);

let version = 'n/a';
const app = express();

const userManager = new UserManager();
const logger = new Logger();

if (process.env.NODE_ENV === 'production') {
  fs.readFile('./config/version.txt', 'utf8', (err, data) => {
    version = err ? 'unknown' : data;
  });
}

// Configure the Bearer strategy for use by Passport.
passport.use('bearer', new BearerStrategy((token, cb) => userManager.validateUserByToken(token, cb)));
passport.use('permbearer', new BearerStrategy((token, cb) => userManager.validateUserByPermToken(token, cb)));
passport.use('beareradmin', new BearerStrategy((token, cb) => userManager.validateAdminByToken(token, cb)));
// require('./strategies/twitter')();
// require('./strategies/buffer')();
// require('./strategies/facebook')();
// require('./strategies/linkedin')();

function errorHandler(error, req, res, next) {
  if (error) {
    console.error('API Error ', error);
    res.status(500).send({ error: error.toString() });
    res.end();
  } else {
    next();
  }
}

// express-loggly integration
const logglyConfig = config.get('Loggly');
morgan.token('uuid', req => req.uuid);
morgan.token('env', req => req.env);
app.use((req, res, next) => {
  req.uuid = uuid.v4();
  req.env = process.env.NODE_ENV || 'local';
  next();
});
expressWinston.requestWhitelist.push('uuid');
expressWinston.requestWhitelist.push('env');
app.use(expressWinston.logger({
  transports: [
    new winston.transports.Loggly({
      inputToken: logglyConfig.token,
      subdomain: logglyConfig.subdomain,
      tags: ['Api'],
      json: true
    })
  ]
}));

const middlewareOptional = (req, res, next) => {
  passport.authenticate('bearer', { session: false }, (err, user) => {
    req.user = user;
    next();
  })(req, res, next);
};

const cleanMongo = (req, res, next) => {
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  next();
};

const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, authorization');
  next();
};

if (process.env.NODE_ENV !== 'production') {
  // TODO: Just add localhost for karma tests
  app.use(corsMiddleware);
}
// create application/json parser
const jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

function setRoutes() {
  const db = jobManager.mongoInstance.db;
  app.use(session({
    secret: 'jhgjg23hg42jh34898234',
    store: new MongoStore({ db, touchAfter: 24 * 3600 }),
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    ttl: 30 * 24 * 60 * 60,
    resave: false,
    saveUninitialized: false }));
  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());
  app.disable('view cache');

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser((id, done) => userManager.getUserById(id, done));

  app.get('/ping', (req, res) => {
    if (req.headers['x-forwarded-for']) {
      // this indicates the request is from nginx server
      const ips = req.headers['x-forwarded-for'].split(', ');
      res.status(200).send({ version, ips });
    } else {
      res.status(200).send({ version });
    }
  });

  // User Auth
  app.post('/signupBeta', jsonParser, authApi.signupBeta);
  app.get('/auth/twitter', (request, response) => {
    request.session.mixpanelId = request.query.mixpanelId;
    passport.authenticate('twitter', {
      scope: ['include_email=true'],
      session: false
    })(request, response);
  });
  app.get('/auth/twitter/callback', corsMiddleware, jsonParser, middlewareOptional,
    passport.authenticate('twitter', { session: false }), authApi.load);
  app.post('/auth/login', cleanMongo, jsonParser, authApi.login);
  app.post('/auth/forgot', cleanMongo, jsonParser, authApi.forgot);
  app.post('/auth/register', cleanMongo, jsonParser, authApi.register);
  app.post('/auth/changePassword', cleanMongo,
    jsonParser, authApi.changePassword);
  app.post('/auth/verifyEmail', cleanMongo,
    passport.authenticate('permbearer', { session: false }),
    jsonParser, authApi.verifyEmail);
  app.get('/auth/load',
    passport.authenticate(['permbearer', 'bearer'], { session: false }),
    authApi.load);
  app.post('/auth/setEmail', jsonParser, cleanMongo,
    passport.authenticate('bearer', { session: false }), authApi.setEmail);
  app.get('/auth/logout', middlewareOptional, authApi.logout);

  // Checkout
  app.get('/me/checkout/:tier', jsonParser, urlencodedParser,
    passport.authenticate(['bearer', 'permbearer'], { session: false }),
    checkoutApi.getCheckoutPage);

  // User
  app.post('/user/onboarding/set', cleanMongo, jsonParser,
    passport.authenticate('bearer', { session: false }),
    userApi.advanceOnboarding);
  app.post('/user/setUserData', cleanMongo, jsonParser,
    passport.authenticate('bearer', { session: false }),
    userApi.setOnboardingData);
  app.post('/user/flagTutorial', cleanMongo, jsonParser,
    passport.authenticate('bearer', { session: false }),
    userApi.flagTutorial);
  app.post('/user/flagNotification', cleanMongo, jsonParser,
    passport.authenticate('bearer', { session: false }),
    userApi.flagNotification);

  // Error Handler
  app.use(errorHandler);
}

const port = process.env.ADMIN_PORT || 7777;
let server = null;

function makeServer(callback) {
  async.waterfall([
    cb => userManager.init(cb)
  ], (err) => {
    if (err) {
      callback(err);
    } else {
      server = app.listen(port);
      setRoutes();
      callback(null, server);
    }
  });
}

if (process.env.COMMAND_RUN) {
  makeServer((err, newServer) => { // eslint-disable-line
    if (err) {
      console.log('err', err);
      logger.error('Fail to initialize API Service', { err });
    } else {
      logger.info('API Service Listening at http://localhost:' + port);
    }
  });
}

module.exports = makeServer;
