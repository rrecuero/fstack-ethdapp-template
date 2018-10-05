import { config } from 'config';
import chargebee from 'chargebee';

const REDIRECT_URL = 'https://oly.ai/dashboard';

// Plans
export const CURATOR = 'assistant-curator';

// Singleton
let instance = null;

const configChargebee = config.get('ChargeBee');

export default class SubscriptionsManager {
  constructor() {
    if (!instance) {
      chargebee.configure({
        site: configChargebee.site,
        api_key: configChargebee.api_key
      });
      instance = this;
    }
    return instance;
  }

  createHostedPageSubscription(planId, user, cb) {
    const hostedPage = chargebee.hosted_page;
    const checkoutFunc = user.subscriptionId
      ? hostedPage.checkout_existing : hostedPage.checkout_new;
    const params = ({
      subscription: {
        plan_id: planId
      },
      customer: {
        id: user && user._id.toString(),
        email: user && user.email,
        first_name: user.name && user.name.split(' ')[0],
        last_name: ''
      },
      reactivate: true,
      redirect_url: configChargebee.redirect_url,
      cancel_url: configChargebee.cancel_url,
      embed: true,
      iframeMessaging: true
    });
    if (user.subscriptionId) {
      params.subscription.id = user.subscriptionId;
    }
    checkoutFunc(params).request((error, result) => {
      if (error) {
        return cb(error);
      }
      result.hosted_page.site = configChargebee.site;
      cb(null, result.hosted_page);
    });
  }

  createSubscription(planId, user, cb) {
    chargebee.subscription.create({
      plan_id: planId,
      customer: {
        id: user._id.toString(),
        email: user.email,
        first_name: user.name && user.name.split(' ')[0],
        last_name: ''
      },
      billing_address: { }
    }).request(cb);
  }

  createPortalSession(user, cb) {
    chargebee.portal_session.create({
      redirect_url: REDIRECT_URL,
      customer: {
        id: user._id.toString()
      }
    }).request(cb);
  }

  activatePortalSession(portalId, token, cb) {
    chargebee.portal_session.activate(portalId, { token }).request(cb);
  }

  retrieveSubscription(subscriptionId, cb) {
    chargebee.subscription.retrieve(subscriptionId).request(cb);
  }

  reactivateSubscription(subscriptionId, cb) {
    chargebee.subscription.reactivate(subscriptionId).request(cb);
  }

  // Only to be used during tests, otherwise use cancel
  deleteSubscription(subscriptionId, cb) {
    chargebee.subscription.delete(subscriptionId).request(cb);
  }

  cancelSubscription(subscriptionId, cb) {
    chargebee.subscription.cancel(subscriptionId).request(cb);
  }
}
