import async from 'async';
import lodash from 'lodash';
import { StringDecoder } from 'string_decoder';
import UserManager from '../users/userManager';

const userManager = new UserManager();

export function advanceOnboarding(req, res, next) {
  const { stepOnboarding } = req.body;
  userManager.setOnboarding(req.user.token, stepOnboarding, (err, resp) => {
    if (err) {
      return next('Couldnt advance onboarding step ' + req.user.token);
    }
    res.status(200).send({ result: userManager.pickPublicInfo(resp.value) });
  });
}

function setFieldsAndReturn(token, fields, res, next) {
  userManager.setOnboardingFields(token, fields, (err, resp) => {
    if (err) {
      console.error(err);
      return next('Couldnt set onboarding fields ' + token);
    }
    res.status(200).send({ result: userManager.pickPublicInfo(resp.value) });
  });
}

export function setOnboardingData(req, res, next) {
  const fields = req.body;
  if (fields.goal || fields.goal === 0) {
    fields.drip = {
      d1: 'strict',
      d3: 'strict',
      d5: 'moderate',
      d10: 'flexible'
    }['d' + fields.goal.toString()];
    fields.sources = ['techcrunch.com', 'economist.com', 'news.ycombinator.com'];
  }
  const user = req.user;
  if (fields.reload) {
    return res.status(200).send({ result: userManager.pickPublicInfo(user) });
  }
  setFieldsAndReturn(user.token, fields, res, next);
}

export function flagTutorial(req, res, next) {
  const tutorial = req.body.tutorial;
  if (!tutorial) {
    return next('No tutorialKey provided');
  }
  userManager.flagTutorial(req.user, tutorial, (err, resp) => {
    if (err) {
      return next('Couldnt set tutorial ' + req.user.token);
    }
    res.status(200).send({ result: userManager.pickPublicInfo(resp.value) });
  });
}

export function flagNotification(req, res, next) {
  const notification = req.body.notification;
  if (!notification) {
    return next('No notificationKey provided');
  }
  userManager.flagNotification(req.user, notification, (err, resp) => {
    if (err) {
      return next('Couldnt set notification ' + req.user.token);
    }
    res.status(200).send({ result: userManager.pickPublicInfo(resp.value) });
  });
}

export function getUsers(req, res, next) {
  userManager.getUsers((error, result) => {
    if (error) {
      return next('Error getting latest processed ' + error);
    }
    res.status(200).send({ result });
  });
}

export function deleteUser(req, res, next) {
  const id = req.body.id;
  userManager.getUserById(id, (errorUser, user) => {
    if (errorUser) {
      return next(' Error deleting user. Could not retrieve user' + errorUser);
    }
    documentManager.deleteUser(user, (error) => {
      if (error) {
        return next(' Error deleting user ' + error);
      }
      userManager.deleteUserById(user._id, (errorDelete) => {
        if (errorDelete) {
          return next(' Error deleting user ' + errorDelete);
        }
      });
      res.status(200).send({ result: { id } });
    });
  });

}

export function deleteUserContent(req, res, next) {
  const id = req.body.id;
  userManager.getUserById(id, (errorUser, user) => {
    if (errorUser) {
      return next(' Error deleting user content. Could not retrieve user' + errorUser);
    }
    userManager.setFields({ token: user.token }, { stepOnboarding: 0, twitter: null }, (err) => {
      if (err) {
        return next(' Error deleting user content when updating fields' + err.toString());
      }
      documentManager.deleteUserContent(user, (error) => {
        if (error) {
          return next(' Error deleting user content' + error);
        }
        res.status(200).send({ result: { id } });
      });
    });
  });
}
