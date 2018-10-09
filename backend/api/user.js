import { ManagementClient } from 'auth0';
import { config } from 'config';

const management = new ManagementClient({
  domain: config.get('auth0').domain,
  clientId: config.get('auth0').client,
  clientSecret: config.get('auth0').secret
});

function getUser(req, res, next) {
  const { userId } = req.query;
  management.getUser({ id: userId, fields: 'user_metadata' }, (error, user) => {
    if (error) {
      return next('Error getting latest user ' + error);
    }
    res.status(200).send({ result: user });
  });
}

module.exports = (app) => {
  app.get('/api/user', getUser);
};
