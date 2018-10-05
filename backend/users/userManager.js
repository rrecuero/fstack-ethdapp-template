import { config } from 'config';
import sha256 from 'sha256';
import jwt from 'jsonwebtoken';
import MongoWrapper from '../storage/mongowrapper';

// Collection users
// - name: Name of the user
// - email: String with the user email
// - password: String with the password encoded in sha256
// - stepOnboarding: Number with current onboarding step
// - token: String with the current authentication token
// - tier: User Tier i.e aficionado, influencer & advocate
// - emailVerified: Boolean that indicates if email has been verified
// - createdAt: Date when the user created the account
// - lastLoggedIn: Date when the user last logged into the account
// - stats: Stats object. Contains unseen, pending, curated & total mins read.
// - seenTutorials: List of strings that represents the tutorials the user has completed.

// Singleton
let instance = null;

export default class UserManager {
  constructor() {
    if (!instance) {
      // this.subscriptionManager = new SubscriptionManager();
      this.mongoInstance = new MongoWrapper(config.mongodb);
      this.connected = false;
      instance = this;
    }
    return instance;
  }

  init(cb) {
    if (this.connected) {
      return cb();
    }
    this.mongoInstance.connect(0, (err) => {
      if (err) {
        throw err;
      }
      this.usersCol = this.mongoInstance.collections('users');
      this.connected = true;
      cb();
    });
  }

  // Users

  getUsers(cb, limit = 100, projection = {}, sort = { createdAt: -1 }) {
    this.usersCol.find({}, projection).sort(sort).limit(limit).toArray(cb);
  }

  getUsersWithEmail(cb, limit = 2000) {
    this.usersCol.find({ email: { $exists: true }, stepOnboarding: { $gte: 3 } })
      .sort({ createdAt: -1 }).limit(limit).toArray(cb);
  }

  countUsers(cb) {
    this.usersCol.count(cb);
  }

  increaseStatsCounter(userId, statIncObj, cb) {
    const _id = this.mongoInstance.getMongoId(userId);
    this.usersCol.findAndModify({ _id }, [],
      { $inc: statIncObj }, { new: true, upsert: false }, cb);
  }

  register(user, cb, isAdmin = false) {
    user.password = sha256(user.password);
    const conditions = [];
    const plan = 'assistant-curator';
    if (user.email) {
      conditions.push({ email: user.email });
    }
    if (conditions.length === 0) {
      return cb('You need to provide either email or twitter.id, or both');
    }

    this.usersCol.findOne({ $or: conditions }, (err, foundUser) => {
      if (err) {
        return cb('Couldnt execute query');
      }
      if (foundUser) {
        return cb('User Already exists');
      }
      user.createdAt = new Date();
      user.lastLoggedIn = new Date();
      user.isAdmin = isAdmin;
      user.stepOnboarding = 0;
      user.tier = plan;
      user.stats = {
        total: 0, unseen: 0, dailyCurated: 0, pending: 0, curated: 0, mins: 0
      };
      user.seenTutorials = [];
      user.seenNotifs = [];
      user.subscriptionId = null;
      user.tier_status = 'in_trial'; // In trial, doesn't start until onboarding is complete
      user.emailVerified = false;
      user.permatoken = jwt.sign({
        name: user.name,
        date: new Date()
      }, user.password, { expiresIn: '5000d' });
      this.usersCol.insertOne(user, (errInsert) => {
        if (errInsert) {
          return cb('Error inserting user');
        }
        this.setToken(user, (err3, finalUser) => {
          cb(err3, finalUser);
        });
      });
    });
  }

  createUserSubscription(plan, user, cb) {
    if (process && process.env && process.env.NODE_ENV !== 'production') {
      return cb(null, user);
    }
    this.subscriptionManager.createSubscription(plan, user, (errSubs, result) => {
      if (errSubs) {
        return cb('Error creating subscription for the user');
      }
      this.usersCol.findAndModify({ _id: user._id }, [],
        {
          $set: {
            tier: plan,
            subscriptionId: result.subscription.id,
            tier_status: result.subscription.status
          }
        },
        { new: true }, (err, fuser) => {
          cb(err && 'Error creating subscription', fuser && fuser.value);
        });
    });
  }

  findUserByEmail(email, cb) {
    this.usersCol.findOne({ email }, cb);
  }

  listUsers(cb, projection = {}, limit = 5000) {
    this.usersCol.find({}, projection).limit(limit).toArray(cb);
  }

  validateUserByToken(token, cb) {
    this.usersCol.findOne({ token }, (err, user) => {
      if (err || !user) {
        return cb(null, false);
      }
      jwt.verify(user.token, user.password, (errV) => {
        if (errV) {
          return cb(null, false);
        }
        this.getSubscriptionStatus(user, (errSub, status) => {
          user.tier_status = status;
          if (errSub) {
            console.error('error getting subscription', errSub);
          }
          return cb(null, user);
        });
      });
    });
  }

  validateUserByPermToken(permatoken, cb) {
    this.usersCol.findOne({ permatoken }, (err, user) => {
      if (err || !user) {
        return cb(null, false);
      }
      jwt.verify(user.permatoken, user.password, { ignoreExpiration: true }, (errV) => {
        if (errV) {
          return cb(null, false);
        }
        this.getSubscriptionStatus(user, (errSub, status) => {
          user.tier_status = status;
          return cb(null, user);
        });
      });
    });
  }

  getSubscriptionStatus(user, cb) {
    if (!user || !user.subscriptionId) {
      return cb(null, 'in_trial');
    }
    this.subscriptionManager.retrieveSubscription(user.subscriptionId, (err, result) => {
      if (err) {
        return cb(err, 'in_trial');
      }
      cb(null, result.subscription.status);
    });
  }

  validateAdminByToken(token, cb) {
    this.validateUserByToken(token, (err, user) => {
      if (!user) {
        return cb(null, false);
      }
      return cb(null, user.isAdmin ? user : false);
    });
  }

  login({ email, password }, cb) {
    const pass = sha256(password);
    this.usersCol.findOne({ email, password: pass }, (err, user) => {
      if (err) {
        return cb('Error validading username & password');
      }
      if (!user) {
        return cb('Password or username invalid');
      }
      this.setToken(user, cb);
    });
  }

  setToken({
    _id, email, password, name, token, subscriptionId
  }, cb) {
    let newToken = false;
    const date = new Date();
    // There is a valid token
    if (token) {
      try {
        if (jwt.verify(token, password)) {
          // Renews the token upon login
          newToken = token;
        }
      } catch (err) {
        newToken = false;
      }
    }
    if (!newToken) {
      newToken = jwt.sign({ email, name, date },
        password, { expiresIn: '90d' });
    }
    this.usersCol.findAndModify({ _id }, [],
      { $set: { token: newToken, lastLoggedIn: new Date(), subscriptionId } },
      { new: true }, (err, user) => {
        if (err) {
          return cb('Error creating token');
        }
        cb(null, user.value);
      });
  }

  updateSubscriptionStatus(user, cb) {
    this.getSubscriptionStatus(user, (errChargebee, tierStatus) => {
      if (errChargebee) {
        return cb(errChargebee);
      }
      this.usersCol.findAndModify({ _id: user._id }, [],
        { $set: { tier_status: tierStatus } }, { new: true }, (err, fuser) => {
          cb(err && 'Error creating token', fuser && fuser.value);
        });
    });
  }

  updateLoggedInDateAndSubscription({ _id, tier, tierStatus }, cb) {
    this.usersCol.findAndModify({ _id }, [],
      { $set: { lastLoggedIn: new Date(), tier, tier_status: tierStatus } }, { new: true }, (err, user) => {
        cb(err && 'Error creating token', user && user.value);
      });
  }

  setEmail({ _id }, email, cb) {
    this.usersCol.findAndModify({ _id }, [],
      { $set: { email } }, { new: true }, (err, user) => {
        if (err) {
          return cb('Error setting email');
        }
        cb(null, user.value);
      });
  }

  findUserBy(params, cb, projection = {}) {
    this.usersCol.findOne(params, projection, cb);
  }

  getUserById(id, cb, projection = {}) {
    const _id = this.mongoInstance.getMongoId(id);
    this.usersCol.findOne({ _id }, projection, cb);
  }

  clearToken({ _id }, cb) {
    this.usersCol.updateOne({ _id }, { $set: { token: null } }, cb);
  }

  pickPublicInfo({
    _id, email, emailVerified, token, permatoken,
    seenTutorials, seenNotifs, name, stepOnboarding, tier, tierStatus
  }) {
    return {
      id: _id.valueOf(),
      email,
      emailVerified,
      token,
      seenTutorials,
      seenNotifs,
      name,
      tier,
      stepOnboarding,
      tier_status: tierStatus,
      permatoken
    };
  }

  deleteUserByEmail(email, cb) {
    this.deleteUser({ email }, cb);
  }

  deleteUserById(_id, cb) {
    const userId = this.mongoInstance.getMongoId(_id);
    this.deleteUser({ _id: userId }, cb);
  }

  deleteUser(query, cb) {
    this.usersCol.findOne(query, (err, user) => {
      if (err) {
        return cb(err);
      }
      if (user && user.subscriptionId) {
        this.subscriptionManager.cancelSubscription(
          user.subscriptionId, (errCancel) => {
            if (errCancel
              && errCancel.api_error_code !== 'invalid_state_for_request'
              && errCancel.api_error_code !== 'resource_not_found') {
              return cb(errCancel);
            }
            this.usersCol.removeOne(query, cb);
          }
        );
      } else {
        this.usersCol.removeOne(query, cb);
      }
    });
  }

  setPassword(queryObj, password, cb) {
    const pass = sha256(password);
    this.setFields(queryObj, { password: pass }, (err, user) => {
      if (err) {
        return cb(err);
      }
      this.setToken(user.value, cb);
    });
  }

  verifyEmail(queryObj, cb) {
    this.setFields(queryObj, { emailVerified: true }, cb);
  }

  // Oauth

  oauthLogin(user, oauthInfo, oauthUserFound,
    registerInfo, documentManager, cb, mixpanelId) {
    // Already all set up
    // User from the oauth Found logging in
    if (oauthUserFound) {
      return this.setToken(oauthUserFound, cb);
    }
    // User already logged in
    if (user) {
      // Grab email from oauth
      if (!user.email && registerInfo.email) {
        user.email = registerInfo.email;
        user.emailVerified = true;
      }
      return this.setIntegrationInfo(user, oauthInfo, cb);
    }
    const registrationUser = Object.assign(registerInfo, oauthInfo);
    this.register(registrationUser, (err, newUser) => {
      if (err) {
        return cb(err);
      }
      cb(null, newUser);
    }, null, mixpanelId);
  }

  setFields(query, fields, cb) {
    this.usersCol.findAndModify(query, [], { $set: fields }, { new: true }, cb);
  }

  setIntegrationInfo(user, object, cb) {
    this.setFields({ permatoken: user.permatoken }, object, (err, resp) => {
      if (err) {
        return cb('Error setting integration info ' + object);
      }
      cb(err, resp.value || user);
    });
  }

  // Tutorials
  flagTutorial(user, tutorialKey, cb) {
    this.usersCol.findAndModify({ token: user.token },
      [], { $push: { seenTutorials: tutorialKey } }, { new: true }, cb);
  }

  flagNotification(user, notificationKey, cb) {
    this.usersCol.findAndModify({ token: user.token },
      [], { $push: { seenNotifs: notificationKey } }, { new: true }, cb);
  }

}
