import userRoutes from './user';
import authRoutes from './auth';

module.exports = (app, db) => {
  userRoutes(app, db);
  authRoutes(app, db);
};
