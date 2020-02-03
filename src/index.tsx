/*
// Started to test with IE...  mostly works but maybe some issues with Material-UI, routine, etc...
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import 'core-js/es/string';
*/
import 'core-js/es/array'; // 01/07/2020 - sufficient for Edge as of today

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux'
import store from './store';

import './index.css';
import * as serviceWorker from './serviceWorker';
import { SimpleTabs } from './components/Menu';

const Main = () => {
    return (
        <Provider store = { store }>
            <SimpleTabs />
        </Provider>
    );
}

window.onload = function() {
    ReactDOM.render( <Main/>, document.getElementById('root') ); 
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
