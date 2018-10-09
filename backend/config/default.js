/* eslint-disable */
export const config = {
  // DB
  mongodb: {
    params: {
      poolSize: 10,
      autoReconnect: true,
      connectTimeoutMS: 10000
    },
    dbname: 'heroku_83k552gr',
    url: "mongodb://...",
    reconnectAttempts: 3
  },
  // Auth0
  auth0: {
    domain: '.com',
    client: 'asd',
    audience: 'https://..',
    secret: 'asdas'
  },
  //Stripe
  Stripe: {
    test: 'sk_live_MY_SECRET_KEY',
    live: 'sk_test_MY_SECRET_KEY'
  },
  // Mail
  Mandrill: {
    key: ''
  },
  jwt: {
    secret: 'asdasd'
  },
  logger: {
    host: 'test',
    port: '1'
  }
};
