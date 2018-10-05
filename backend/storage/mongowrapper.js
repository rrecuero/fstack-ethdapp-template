import { MongoClient, ObjectID } from 'mongodb';
import async from 'async';

// Singleton
let instance = null;

export default class MongoWrapper {
  constructor(config) {
    if (!instance) {
      this.config = config;
      this.mongoClient = MongoClient;
      this.db = {};
      this.dbcollections = {};
      this.connected = false;
      this.attempts = 0;
      instance = this;
    }
    return instance;
  }

  connect(attempts = 0, cb) {
    if (this.connected) {
      return cb();
    }
    const params = Object.assign(this.config.params, {
      useNewUrlParser: true
    });

    MongoClient.connect(
      process.env.MONGODB_URI || this.config.url,
      params,
      (err, client) => {
        if (err) {
          if (attempts <= this.config.reconnectAttempts) {
            console.error(`MongoDB: connection failure ${err}, trying again`);
            setTimeout(() => {
              this.connect(attempts + 1, cb);
            }, 3000);
          } else {
            console.error(`Giving up on connecting Mongo ${err}`);
            process.exit(1);
          }
        } else {
          this.db = client.db(this.config.dbname);
          this.applyIndexes(cb);
          this.connected = true;
        }
      }
    );
  }

  collections(name) {
    if (name in this.dbcollections) {
      return this.dbcollections[name];
    }
    this.dbcollections[name] = this.db.collection(name);
    return this.dbcollections[name];
  }

  applyIndexes(cb) {
    const users = this.db.collection('users');
    async.parallel([
      (callback) => {
        users.createIndex({ email: 1 }, callback);
      }, (callback) => {
        users.createIndex({ email: 1, password: 1 }, callback);
      }, (callback) => {
        users.createIndex({ token: 1 }, callback);
      }, (callback) => {
        users.createIndex({ createdAt: -1 }, callback);
      }
    ], cb);
  }

  getMongoId(id) {
    try {
      return ObjectID(id); // eslint-disable-line new-cap
    } catch (error) {
      return null;
    }
  }
}
