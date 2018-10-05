import userRoutes from './user';
import authRoutes from './auth';
import checkoutRoutes from './checkout';

module.exports = (app, db) => {
  userRoutes(app, db);
  authRoutes(app, db);
  checkoutRoutes(app, db);
};
