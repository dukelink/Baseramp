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

import React, { ComponentType } from 'react';
import { Provider, connect, ConnectedComponent } from 'react-redux';
import { compose } from 'redux';
import store from '../../store';
import { RootState } from '../../rootReducer';
import { SystemNavigator } from './SystemNavigator';

import  Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import { FormControlLabel, FormControl, TextField, Select, Switch, MenuItem, InputLabel, makeStyles } 
  from '@material-ui/core';

configure({ adapter: new Adapter() })

// Suppress console messages during unit testing...
jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn()); 
jest.spyOn(global.console, 'warn').mockImplementation(() => jest.fn()); 

function renderWithRedux(
    component : 
        React.FC 
        | React.Component 
        | JSX.ElementAttributesProperty
        | ConnectedComponent<any,any>,
    props ?: any
) {
    return (                               
            <Provider store={store}>
            { component }
            </Provider>
        )
}
