import UserManager from '../users/userManager';
import EmailManager from '../email/emailManager';

const emailManager = new EmailManager();
const userManager = new UserManager();

function load(req, res, next) {
  if (!req.user) {
    return next('No user to load');
  }
  userManager.updateLoggedInDateAndSubscription(req.user, (err) => {
    if (err) {
      return next('Could not load user' + err.toString());
    }
    const user = userManager.pickPublicInfo(req.user);
    res.status(200).send({ result: user });
  });
}

function setEmail(req, res, next) {
  const { email } = req.body;
  if (req.user && !req.user.email) {
    userManager.setEmail(req.user, email, (err, user) => {
      if (err) {
        return next('Error setting email for user: ' + err.toString());
      }
      const publicUserInfo = userManager.pickPublicInfo(user);
      res.status(200).send({ result: publicUserInfo });
    });
  }
}

function logout(req, res, next) {
  req.session.destroy(() => {
    if (req.user) {
      userManager.clearToken(req.user, (err) => {
        if (err) {
          return next('Error logging out user ' + err);
        }
        res.status(200).send({ result: null });
      });
    } else {
      res.status(200).send({ result: null });
    }
  });
}

function login(req, res, next) {
  const { email, password, key } = req.body;
  const ret = (err, user) => {
    if (err || !user) {
      return next('Error validating user: ' + err);
    }
    const publicUserInfo = userManager.pickPublicInfo(user);
    res.status(200).send({ result: publicUserInfo });
  };
  if (key) {
    return userManager.validateUserByPermToken(key, (err, user) => {
      if (err) {
        return ret(err, null);
      }
      userManager.setToken(user, ret);
    });
  }
  userManager.login({ email, password }, ret);
}

function forgot(req, res, next) {
  const { email } = req.body;
  userManager.findUserByEmail(email, (errEmail, userEmail) => {
    if (errEmail || !userEmail) {
      return next('Could not retrieve any user with that email');
    }
    emailManager.sendForgotEmail(userEmail, (result) => {
      res.status(200).send({ result });
    }, (error) => {
      next('A mandrill error occurred: ' + error.name + ' - ' + error.message);
    });
  });
}

function changePassword(req, res, next) {
  const { password, rpassword, token } = req.body;
  if (password !== rpassword) {
    return next('Error changing password: Passwords do not match!');
  }
  userManager.setPassword({ permatoken: token }, password, (err2, resp) => {
    if (err2) {
      return next('Could not change password ' + err2.toString());
    }
    const publicUserInfo = userManager.pickPublicInfo(resp);
    res.status(200).send({ result: publicUserInfo });
  });
}

function verifyEmail(req, res, next) {
  if (!req.user.email) {
    return next('Error verifying email. Does not have any');
  }
  userManager.verifyEmail({ permatoken: req.user.permatoken }, (err2) => {
    if (err2) {
      return next('Could not verify email ' + err2.toString());
    }
    res.status(200).send({ result: true });
  });
}

function register(req, res, next) {
  const {
    name, password, rpassword, email
  } = req.body;
  if (password !== rpassword) {
    return next('Error registering user: Passwords do not match!');
  }
  userManager.register({ name, password, email }, (err, user) => {
    if (err) {
      return next('Error registering user: ' + err);
    }
    const publicUserInfo = userManager.pickPublicInfo(user);
    return emailManager.sendWelcomeEmail(user, () => {
      res.status(200).send({ result: publicUserInfo });
    }, (error) => {
      next('A mandrill error occurred: ' + error.name + ' - ' + error.message);
    });
  });
}

module.exports = (app) => {
  app.post('/api/auth/login', login);
  app.post('/api/auth/forgot', forgot);
  app.post('/api/auth/signup', register);
  app.post('/api/auth/changePassword', changePassword);
  app.post('/api/auth/verifyEmail', verifyEmail);
  app.get('/api/auth/load', load);
  app.post('/api/auth/setEmail', setEmail);
  app.get('/api/auth/logout', logout);
};
