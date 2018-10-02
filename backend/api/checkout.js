import SubscriptionsManager from '../subscriptions/subscriptionsManager';

const subscriptionsManager = new SubscriptionsManager();

export function getCheckoutPage(req, res, next) {
  const { tier } = req.params;
  if (!tier) {
    return next('No tier provided');
  }
  subscriptionsManager.createHostedPageSubscription(tier, req.user, (err, hostedPage) => {
    if (err) {
      return next('Could not create hosted page for ' + tier);
    }
    return res.status(200).send({ result: hostedPage });
  });
}

export function getPortalPage(req, res) {
  return res.status(200).send({ result: 'ok' });
}
