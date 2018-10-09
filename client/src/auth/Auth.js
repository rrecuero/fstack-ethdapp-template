import auth0 from 'auth0-js';

const REDIRECT_URI = process.env.NODE_ENV === 'production'
  ? window.location.origin + '/callback'
  : 'http://localhost:3000/callback';

function json(response) {
  return response.json()
}

export default class Auth {

  requestedScopes = 'openid profile read:messages write:messages';
  constructor(history) {
    this.auth0 = new auth0.WebAuth({
      domain: 'dapis.auth0.com',
      clientID: 'EcDmjEPPOYAnBiY9o0jSEsukqdCfITdW',
      audience: 'https://dblog.dapis.io/api',
      redirectUri: REDIRECT_URI,
      responseType: 'token id_token',
      scope: this.requestedScopes
    });
    this.history = history;
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.scheduleRenewal();
 }

  handleAuthentication() {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setSession(authResult);
        this.getProfile((err, profile) => {
          if (profile && profile.paid) {
            window.location.href = '/paid';
          } else {
            window.location.href = '/checkout';
          }
        });
      } else if (err) {
        window.location.href = '/';
      }
    });
  }

  setSession(authResult) {
    const scopes = authResult.scope || this.requestedScopes || '';
    // Set the time that the Access Token will expire at
    let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('scopes', JSON.stringify(scopes));
    // schedule a token renewal
    this.scheduleRenewal();
    // navigate to the home route
    // window.location.href = '/';
  }

  getAccessToken() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No Access Token found');
    }
    return accessToken;
  }

  getProfile(cb) {
    let accessToken = this.getAccessToken();
    this.auth0.client.userInfo(accessToken, (err, profile) => {
      if (profile) {
        this.userProfile = profile;
      }
      fetch('/api/user?userId=' + profile.sub,
        {
          method: 'GET',
          mode: 'cors',
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            'Authorization': `Bearer ${accessToken}`
          },
        })
        .then(json)
        .then((response) => {
          this.userProfile.user_metadata = response.result.user_metadata;
          if (cb) {
            cb(null, this.userProfile);
          }
        })
        .catch((error) => {
          cb(error);
        });
    });
  }

  renewToken() {
    this.auth0.checkSession({}, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          this.setSession(result);
        }
      }
    );
  }

  scheduleRenewal() {
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    const delay = expiresAt - Date.now();
    if (delay > 0) {
      this.tokenRenewalTimeout = setTimeout(() => {
        this.renewToken();
      }, delay);
    }
  }

  userHasScopes(scopes) {
    const grantedScopes = JSON.parse(localStorage.getItem('scopes')).split(' ');
    return scopes.every(scope => grantedScopes.includes(scope));
  }

  logout() {
    // Clear Access Token and ID Token from local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('paid');
    // navigate to the home route
    window.location.href = '/';
    clearTimeout(this.tokenRenewalTimeout);
  }

  isAuthenticated() {
    // Check whether the current time is past the
    // Access Token's expiry time
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  hasPaid() {
    return JSON.parse(localStorage.getItem('paid')) || this.userProfile.user_metadata.paid;
  }

  login() {
    this.auth0.authorize();
  }
}
