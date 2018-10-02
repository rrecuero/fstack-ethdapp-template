import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { config } from 'config';
import UserManager from '../../users/userManager';
import DocumentManager from '../../documents/documentManager';
import SocialSyncManager from '../../social/socialSyncManager';
import LinkManager from '../../documents/linkManager';
import { mixpanel } from '../../utils/utils';

const userManager = new UserManager();
const documentManager = new DocumentManager();
const linkManager = new LinkManager();
const socialSyncManager = new SocialSyncManager(userManager);

function loadInitialTopics(user, cb) {
  const start = new Date().getTime();
  if (!user.topics || user.topics.length === 0) {
    const update = {
      topics: ['artificial-intelligence', 'vr'],
      sources: ['techcrunch.com', 'economist.com', 'news.ycombinator.com']
    };
    return socialSyncManager.syncTwitterUserOwnFeed(user, (errUser, links) => {
      // do not break the whole sync
      if (errUser) {
        console.error('twitter sync error', { errUser });
        return cb(null, update);
      }
      if (links && links.length > 0) {
        return linkManager.getTopTopicsFromLinks(links, (err, results, sourcesR) => {
          if (results && results.length > 0) {
            update.topics = results.map(t => t.name).slice(0, 7);
          }
          if (sourcesR && sourcesR.length > 0) {
            update.sources = sourcesR.map(t => t.domain).slice(0, 7);
          }
          mixpanel.track('t_load_initial_topics', { duration: new Date().getTime() - start });
          return cb(null, update);
        });
      }
      return cb(null, update);
    }, true);
  }
  return cb(null, false);
}

module.exports = () => {
  // Use twitter strategy
  passport.use(new TwitterStrategy({
    consumerKey: config.get('TwitterApp').clientID,
    consumerSecret: config.get('TwitterApp').clientSecret,
    callbackURL: config.get('TwitterApp').callbackURL,
    includeEmail: true,
    passReqToCallback: true
  }, (req, token, tokenSecret, profile, done) => {
    // Set the provider data and include tokens
    const providerData = profile._json;
    // Create the user OAuth profile
    const providerUserProfile = {
      twitter: {
        id: profile.id,
        token,
        secret: tokenSecret,
        login: profile.username,
        displayName: profile.displayName,
        sync: true,
        like: false,
        sinceLikeId: null,
        sinceId: null,
        lastSync: null,
        avatar: providerData.profile_image_url_https
      }
    };
    const registerInfo = {
      name: profile.displayName,
      password: profile.id + profile.username,
    };
    if (profile.emails && profile.emails.length > 0) {
      const email = profile.emails[0].value;
      registerInfo.email = email;
      registerInfo.emailVerified = true;
    }
    const friends = [];
    providerUserProfile.twitter.friends = friends;

    let start = new Date().getTime();
    userManager.findUserBy({ 'twitter.id': profile.id }, (errF, userFound) => {
      mixpanel.track('t_find_user', { duration: new Date().getTime() - start, error: errF });
      if (errF) {
        return done(errF);
      }

      start = new Date().getTime();
      userManager.oauthLogin(req.user, providerUserProfile, userFound,
        registerInfo, documentManager, (errOauth, user) => {
          mixpanel.track('t_oauth', { duration: new Date().getTime() - start, error: errOauth });
          if (errOauth) {
            return done(errOauth);
          }
          user.twitter.friends = friends;
          loadInitialTopics(user, (err, update) => {
            if (update) {
              userManager.setOnboardingFields(user.token, update, (errTopics) => {
                if (err) {
                  console.error(errTopics);
                }
              });
            }
          });
          return done(null, user);
        }, req.session.mixpanelId);
    });
  }));
};
