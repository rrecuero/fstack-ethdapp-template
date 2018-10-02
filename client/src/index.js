import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './utils/registerServiceWorker';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';

// import drizzle functions
import { Drizzle, generateStore } from 'drizzle';
import { DrizzleContext } from 'drizzle-react';
import { LoadingContainer } from 'drizzle-react-components';
// import contract artifacts

import MyStringStore from './contracts/MyStringStore.json';

// import css
import 'font-awesome/css/font-awesome.min.css';
// import 'bulma/bulma.sass';
import './index.scss';

// let drizzle know what contracts we want
const options = { contracts: [MyStringStore] };

// setup the drizzle store and drizzle
const drizzleStore = generateStore(options);
const drizzle = new Drizzle(options, drizzleStore);
const history = createBrowserHistory();

ReactDOM.render(<App drizzle={drizzle} />, document.getElementById('root'));
registerServiceWorker();

// TODO: Move out
const NoMatch = ({ location }) => (
  <div>
    <h3>
      No match for <code>{location.pathname}</code>
    </h3>
  </div>
);

ReactDOM.render((
    <DrizzleContext.Provider drizzle={drizzle}>
      <App drizzle={drizzle}>
        <LoadingContainer>
          <Router history={history} store={drizzleStore}>
            <Switch>
              <Route exact path="/" component={App} />
              <Route component={NoMatch} />
            </Switch>
          </Router>
        </LoadingContainer>
      </App>
    </DrizzleContext.Provider>
  ),
  document.getElementById('root')
);
