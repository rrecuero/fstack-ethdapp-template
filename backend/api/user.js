import UserManager from '../users/userManager';

const userManager = new UserManager();

function advanceOnboarding(req, res, next) {
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

function setOnboardingData(req, res, next) {
  const { user } = req;
  setFieldsAndReturn(user.token, req.body, res, next);
}

function flagTutorial(req, res, next) {
  const { body: { tutorial } } = req;

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

function flagNotification(req, res, next) {
  const { body: { notification } } = req;
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

function getUsers(req, res, next) {
  userManager.getUsers((error, result) => {
    if (error) {
      return next('Error getting latest processed ' + error);
    }
    res.status(200).send({ result });
  });
}

function deleteUser(req, res, next) {
  const { body: { id } } = req;
  userManager.getUserById(id, (errorUser, user) => {
    if (errorUser) {
      return next(' Error deleting user. Could not retrieve user' + errorUser);
    }
    userManager.deleteUserById(user._id, (errorDelete) => {
      if (errorDelete) {
        return next(' Error deleting user ' + errorDelete);
      }
    });
    res.status(200).send({ result: { id } });
  });

}


module.exports = (app) => {
  app.post('/user/onboarding/set', advanceOnboarding);
  app.post('/user/setUserData', setOnboardingData);
  app.post('/user/flagTutorial', flagTutorial);
  app.post('/user/flagNotification', flagNotification);
  app.get('/users/', getUsers);
  app.delete('/user/', deleteUser);
};
