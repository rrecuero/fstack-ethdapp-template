import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Auth from './auth/Auth';
import registerServiceWorker from './utils/registerServiceWorker';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import NoMatch from './containers/NoMatch';
import Product from './containers/Product';
import Subscription from './containers/Subscription';
import Loading from './containers/Loading';

// import drizzle functions
import { Drizzle, generateStore } from 'drizzle';
import { DrizzleContext } from 'drizzle-react';
// import { LoadingContainer } from 'drizzle-react-components';
// import contract artifacts

import MyStringStore from './contracts/MyStringStore.json';

// import css
import 'font-awesome/css/font-awesome.min.css';
import 'bulma/bulma.sass';
import './index.scss';

const auth = new Auth();

// let drizzle know what contracts we want
const options = { contracts: [MyStringStore] };

// setup the drizzle store and drizzle
const drizzleStore = generateStore(options);
const drizzle = new Drizzle(options, drizzleStore);
const history = createBrowserHistory();


ReactDOM.render((
    <DrizzleContext.Provider drizzle={drizzle}>
      <App auth={auth} drizzle={drizzle}>
        <Router history={history} store={drizzleStore}>
          <Switch>
            <Route exact path="/" component={App} />
            <Route exact path="/callback" render={(props) => {
              auth.handleAuthentication(props);
              return <Loading {...props} />
            }}/>
            <Route exact path="/subscription" render={(props) => (
              !auth.isAuthenticated() ? (
                <Redirect to="/"/>
              ) : (
                <Subscription auth={auth} {...props} />
              )
            )} />
            <Route exact path="/product" render={(props) => (
              !auth.isAuthenticated() || !auth.hasPaid()? (
                <Redirect to="/"/>
              ) : (
                <Product auth={auth} drizzle={drizzle} {...props} />
              )
            )} />
            <Route component={NoMatch} />
          </Switch>
        </Router>
      </App>
    </DrizzleContext.Provider>
  ),
  document.getElementById('root')
);
registerServiceWorker();
