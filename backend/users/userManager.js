import { config } from 'config';
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
      this.postsCol = this.mongoInstance.collections('posts');
      this.connected = true;
      cb();
    });
  }

  // Posts
  insertPost(post, cb) {
    this.postsCol.insertOne(post, (errInsert) => {
      if (errInsert) {
        return cb('Error inserting user');
      }
      cb(null, post);
    });
  }

  getUserPosts(userId, cb, limit = 100, projection = {}, sort = { createdAt: -1 }) {
    this.postsCol.find({ userId }, projection).sort(sort).limit(limit).toArray(cb);
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

}
