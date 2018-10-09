import userRoutes from './user';
import checkoutRoutes from './checkout';

module.exports = (app, db) => {
  userRoutes(app, db);
  checkoutRoutes(app, db);
};
