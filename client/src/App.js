import React, { Component } from 'react';
import logo from './logo.svg';
import './App.scss';

class App extends Component {
  state = { loading: true, drizzleState: null };

  componentDidMount() {
    const { drizzle } = this.props;

    // subscribe to changes in the store
    this.unsubscribe = drizzle.store.subscribe(() => {

      // every time the store updates, grab the state from drizzle
      const drizzleState = drizzle.store.getState();

      // check to see if it's ready, if so, update local component state
      if (drizzleState.drizzleStatus.initialized) {
        this.setState({ loading: false, drizzleState });
      }
    });
    this.ping();
    if (this.props.auth.isAuthenticated()) {
      this.props.auth.getProfile(() => { });
    }
  }

  login() {
    this.props.auth.login();
  }

  logout() {
    this.props.auth.logout();
  }

  compomentWillUnmount() {
    this.unsubscribe();
  }

  ping() {
    return fetch(`/api/ping`, {
      accept: 'application/json',
    })
    .then(res => res.json())
    .then(
      (result) => {
        this.setState({
          apiLoaded: true
        });
      },
      // Note: it's important to handle errors here
      // instead of a catch() block so that we don't swallow
      // exceptions from actual bugs in components.
      (error) => {
        this.setState({
          apiLoaded: true,
          apiError: error
        });
      }
    )
  }


  render() {
    if (this.state.loading) {
      return "Loading Drizzle...";
    }
    const { isAuthenticated } = this.props.auth;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to Full Stack Dapp Template</h1>
        </header>
        <div className="App-intro">
          {isAuthenticated() &&
            <div className="logged-container">
               <button
                 className="button"
                 onClick={this.logout.bind(this)}
               >
                 <span>Log Out</span>
               </button>
            </div>
          }
          {!isAuthenticated() &&
            <button
              className="button"
              onClick={this.login.bind(this)}
            >
              <span>Sign Up</span>
            </button>
          }
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default App;
