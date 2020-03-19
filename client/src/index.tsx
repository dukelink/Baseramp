/*
    Baseramp Project Manager - An open source Project Management software built
    as a Single Page Application (SPA) and Progressive Web Application (PWA) using
    Typescript, React, and an extensible SQL database model.

    Copyright (C) 2019-2020  William R. Lotherington, III

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*
// Started to test with IE...  mostly works but maybe some issues with Material-UI, routine, etc...
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import 'core-js/es/string';
*/
import 'core-js/es/array'; // 01/07/2020 - sufficient for Edge browser as of today

import React from 'react';
import ReactDOM from 'react-dom';
import { CssBaseline, ThemeProvider, createMuiTheme } from '@material-ui/core'

import { Provider, useSelector } from 'react-redux'
import store from './store';
import { RootState } from './rootReducer';
import { loadMetadata } from './model/ModelThunks'; 

import './index.css';
import * as serviceWorker from './serviceWorker';
import { SimpleTabs } from './features/Menu/Menu';

import 'typeface-roboto';
import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';

const Main = () => {
    return (
        <Provider store = { store }>
            <UI /> 
        </Provider>
    );
}

const UI = () => {
    const palettetype = useSelector((state:RootState)=>(state.settings.paletteType));

    loadMetadata(); 

    const theme : ThemeOptions = {
        palette: {
            type: palettetype
        }
    };
    const muiTheme = createMuiTheme(theme);
    return <>
        <CssBaseline />
        <ThemeProvider theme={muiTheme}>
            <SimpleTabs />
        </ThemeProvider>
    </>;
}

window.onload = function() {
    ReactDOM.render( <Main/>, document.getElementById('root') ); 
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
