import React, { Component } from 'react';
import './Loading.scss';

class Loading extends Component {
  render() {

    return (
      <div class="loading-container">
        <h1>
          {this.props.msg || 'Creating your account...'}
        </h1>
      </div>
    );
  }
}

export default Loading;
