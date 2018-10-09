import React, { Component } from 'react';
import Checkout from '../components/Checkout';
import './Subscription.scss';

class Subscription extends Component {

  componentDidMount() {

  }

  render() {
    return (
      <div className="App">
        <Checkout
          apiToken={this.props.auth.getAccessToken()}
          userId= {this.props.auth && this.props.auth.userProfile.sub}
          name={'Product Subscription'}
          description={'One Month'}
          amount={9}
       />
      </div>
    );
  }
}

export default Subscription;
