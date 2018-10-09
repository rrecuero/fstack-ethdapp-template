import userRoutes from './user';
import checkoutRoutes from './checkout';
import walletRoutes from './wallet';

module.exports = (app, db) => {
  userRoutes(app, db);
  checkoutRoutes(app, db);
  walletRoutes(app, db);
};
