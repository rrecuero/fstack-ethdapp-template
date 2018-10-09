import React, { Component } from 'react';
import Checkout from './components/Checkout';
import './Subscription.scss';

class Subscription extends Component {

  componentDidMount() {

  }

  render() {
    return (
      <div className="App">
      <Checkout
         name={'The Road to learn React'}
         description={'Only the Book'}
         amount={1}
       />
      </div>
    );
  }
}

export default Subscription;
