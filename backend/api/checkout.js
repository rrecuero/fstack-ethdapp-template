import configureStripe from 'stripe';
import { config } from 'config';

const STRIPE_SECRET_KEY = process.env.NODE_ENV === 'production'
  ? config.get('Stripe').live : config.get('Stripe').test;

const stripe = configureStripe(STRIPE_SECRET_KEY);

const postStripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    res.status(500).send({ error: stripeErr });
  } else {
    res.status(200).send({ success: stripeRes });
  }
};

module.exports = (app) => {
  app.post('/api/checkout', (req, res) => {
    stripe.charges.create(req.body, postStripeCharge(res));
  });
};
