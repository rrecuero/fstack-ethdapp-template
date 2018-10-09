import React, { Component } from 'react';
import ReadString from "../components/ReadString";
import SetString from "../components/SetString";
import './Product.scss';

class Product extends Component {

  componentDidMount() {

  }

  render() {
    const { drizzle, drizzleState } = this.props;
    return (
      <div className="App">
        <ReadString
          drizzle={drizzle}
          drizzleState={drizzleState}
        />
        <SetString
          drizzle={drizzle}
          drizzleState={drizzleState}
        />
      </div>
    );
  }
}

export default Product;
