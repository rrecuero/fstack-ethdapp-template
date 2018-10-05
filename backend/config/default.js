/* eslint-disable */
export const config = {
  // DB
  mongodb: {
    params: {
      poolSize: 10,
      autoReconnect: true,
      connectTimeoutMS: 10000
    },
    url: 'mongodb://<user>:<password>@aws-us-east-1-portal.15.dblayer.com:10020,aws-us-east-1-portal.16.dblayer.com:10021/meta?ssl=true',
    reconnectAttempts: 3
  },
  // Payments Chargebee
  ChargeBee: {
    site: 'olyai-test',
    api_key: 'test_***',
    redirect_url: 'http://localhost:3000/successSub=true',
    cancel_url: 'http://localhost:3000/cancelSub=true'
  },
  // Mail
  Mandrill: {
    key: ''
  },
  jwt: {
    secret: 'asdasd'
  },
  MailChimp: {
    baseUrl: 'https://us12.api.mailchimp.com/3.0/lists/9220442511/members',
    apiKey: '*'
  }
};
