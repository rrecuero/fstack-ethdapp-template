import request from 'superagent';
import { config } from 'config';
import UserManager from '../users/userManager';
import EmailManager from '../email/emailManager';

const emailManager = new EmailManager();
const userManager = new UserManager();

export function load(req, res, next) {
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

export function setEmail(req, res, next) {
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

export function logout(req, res, next) {
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

export function signupBeta(req, res, next) {
  const { email } = req.body;
  const mailChimpConfig = config.MailChimp;
  request.post(mailChimpConfig.baseUrl)
    .set('Authorization', 'apikey ' + mailChimpConfig.apiKey) // this sets a header field
    .send({
      email_address: email,
      status: 'subscribed'
    })
    .end((err, response) => {
      if (response.statusCode === 200) {
        res.status(200).send({ result: 'user subscribed' });
      }
      if (err) {
        try {
          const { title } = JSON.parse(response.error.text);
          if (title === 'Member Exists') {
            next('Email already added to the list.');
          } else {
            next('Please enter a valid email.');
          }
        } catch (err2) {
          next('Please enter a valid email');
        }
      }
    });
}

export function login(req, res, next) {
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

export function forgot(req, res, next) {
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

export function changePassword(req, res, next) {
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

export function verifyEmail(req, res, next) {
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

export function register(req, res, next) {
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
