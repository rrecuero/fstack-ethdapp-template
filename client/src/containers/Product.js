import React, { Component } from 'react';
import ReadString from "./components/ReadString";
import SetString from "./components/SetString";
import './Product.scss';

class Product extends Component {

  componentDidMount() {

  }

  render() {
    const { drizzle, drizzleState } = this.props;
    return (
      <div className="App">
        <ReadString
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        />
        <SetString
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        />
      </div>
    );
  }
}

export default Product;
