import React, { Component } from 'react';
import ReadString from "../components/ReadString";
import SetString from "../components/SetString";
import './Product.scss';

class Product extends Component {
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
  }

  render() {
    if (this.state.loading) {
      return "Loading Drizzle...";
    }
    console.log('this.props', this.props);
    const { drizzle } = this.props;
    return (
      <div className="App">
        <ReadString
          drizzle={drizzle}
          drizzleState={this.state.drizzleState}
        />
        <SetString
          drizzle={drizzle}
          drizzleState={this.state.drizzleState}
        />
      </div>
    );
  }
}

export default Product;
