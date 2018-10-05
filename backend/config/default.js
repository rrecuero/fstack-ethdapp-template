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
    url: "mongodb://heroku_83k552gr:hh05c3fup8j8b7jokv6eovsqc@ds223763.mlab.com:23763/heroku_83k552gr",
    reconnectAttempts: 3
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
  },
  MailChimp: {
    baseUrl: 'https://us12.api.mailchimp.com/3.0/lists/9220442511/members',
    apiKey: '*'
  }
};
