import { config } from 'config';
import mandrill from 'mandrill-api/mandrill';

// Singleton
let instance = null;

export default class EmailManager {
  constructor() {
    if (!instance) {
      this.mandrillClient = new mandrill.Mandrill(config.get('Mandrill').key);
      instance = this;
    }
    return instance;
  }

  sendForgotEmail(user, cbSuccess, cbError) {
    this.mandrillClient.messages.sendTemplate({
      message: {
        to: [
          {
            email: user.email,
            name: user.name
          }
        ],
        global_merge_vars: [
          {
            name: 'first_name',
            content: user.name
          },
          {
            name: 'link_reset',
            content: 'https://oly.ai/auth/reset/' + user.permatoken
          }
        ]
      },
      async: false,
      template_name: 'forgot',
      template_content: [{
        name: user.name
      }]
    }, cbSuccess, cbError);
  }

  sendWelcomeEmail(user, cbSuccess, cbError) {
    this.mandrillClient.messages.sendTemplate({
      message: {
        to: [
          {
            email: user.email,
            name: user.name
          }
        ],
        global_merge_vars: [
          {
            name: 'first_name',
            content: user.name
          }
        ]
      },
      async: false,
      template_name: 'welcome',
      template_content: [{
        name: user.name
      }]
    }, cbSuccess, cbError);
  }
}
