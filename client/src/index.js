import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './utils/registerServiceWorker';

// import drizzle functions and contract artifact
import { Drizzle, generateStore } from "drizzle";
import MyStringStore from "./contracts/MyStringStore.json";

// import css
import 'font-awesome/css/font-awesome.min.css';
import 'bulma/bulma.sass';
import './index.scss';

// let drizzle know what contracts we want
const options = { contracts: [MyStringStore] };

// setup the drizzle store and drizzle
const drizzleStore = generateStore(options);
const drizzle = new Drizzle(options, drizzleStore);

ReactDOM.render(<App drizzle={drizzle} />, document.getElementById('root'));
registerServiceWorker();
