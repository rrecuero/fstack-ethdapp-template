import React from 'react'
// import axios from 'axios';
import StripeCheckout from 'react-stripe-checkout';

const STRIPE_PUBLISHABLE = process.env.NODE_ENV === 'production'
  ? 'pk_live_MY_PUBLISHABLE_KEY'
  : 'pk_test_MY_PUBLISHABLE_KEY';

const PAYMENT_SERVER_URL = '/api/checkout';

const CURRENCY = 'USD';

const successPayment = data => {
  alert('Payment Successful');
};

const onToken = (amount, description) => token =>
  fetch.post(PAYMENT_SERVER_URL,
    {
      description,
      source: token.id,
      currency: CURRENCY,
      amount: amount * 100
    })
    .then(successPayment)
    .catch((data) => {
      alert('Payment Error');
    });

const Checkout = ({ name, description, amount }) =>
  <StripeCheckout
    name={name}
    description={description}
    amount={amount * 100}
    token={onToken(amount, description)}
    currency={CURRENCY}
    stripeKey={STRIPE_PUBLISHABLE}
  />

export default Checkout;
