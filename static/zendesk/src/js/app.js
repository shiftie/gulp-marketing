// This should be the entry point of ASYNC loaded script
// (not mandatory for early layout setting)

import React from 'react';
import ReactDOM from 'react-dom';
import './globals.js'; // Shows how to expose globals, DO NOT DO THIS :)
import './plugins.js';

console.log('im app & im heavy weight & loaded ASYNC');

// Globals work
$('body').css('background', 'hotpink');

// React
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}

ReactDOM.render(
  <HelloMessage name="John" />,
  document.getElementById('app')
);