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

//
// NOTE: These tests are not combined with those in NodeForm-adding.enzyme.test.tsx
//       because the Redux state conflicts as tests are running asynchronously.
//       It is possible to run them sychronously and often that is even faster, 
//       but if may be neccessary to eject from CRA to setup this configuration.
// See: https://stackoverflow.com/questions/32751695/how-to-run-jest-tests-sequentially

import React from 'react';
import { Provider, ConnectedComponent, useSelector } from 'react-redux';
import store from '../../store';
import { RootState } from '../../rootReducer';
import { NodeFormView } from './NodeFormView';
import { addNewBlankRecordForm, setFocus } from '../SystemNavigator/NavigateSlice';
import  Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import { ViewModelState } from '../../model/ModelTypes';
import { setTestDataMode } from '../../model/ModelThunks';

configure({ adapter: new Adapter() });

// Suppress console.log() messages during unit testing...
jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());

// I'm not masking error.warn() at present, as it is useful feedback 
// (and a useful channel to introduce) during test coding...
// jest.spyOn(global.console, 'warn').mockImplementation(() => jest.fn());

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

const tableToTest = 'AppColumn';

store.dispatch(setTestDataMode(true));
store.dispatch(setFocus({table: 'AppColumn', tableID: 'AppColumn_AppTable_id'})); 

const ReflectDescription = () => {
    const viewModel = useSelector<RootState,ViewModelState>(state=>state.model.apiModel);
    return (
        <div id='testme'>
            { viewModel['AppColumn']['AppColumn_AppTable_id']['AppColumn_description'] }
        </div>
    )
}

const sampleDescriptionFieldValue = 'Hello @ @';

describe("NodeFormView", ()=>{
    const wrapper = mount( renderWithRedux(
        <NodeFormView /> 
    ));

    it('Can we find the description field?',()=>{ 
        // Enter the specific test value above into the AppColumn description field
        wrapper.find('span#AppField_AppColumn_description textarea');
        expect(wrapper).toHaveLength(1);
    });

    it('Updating the description field and saving the change does not throw an error',()=>{ 
        const sampleDescriptionFieldValue = 'Hello @ @';
        // Enter the specific test value above into the AppColumn description field
        wrapper.find('span#AppField_AppColumn_description textarea').first()
            .simulate('change', { target: { value: sampleDescriptionFieldValue } });
        // Depress the "save" button on the form
        wrapper.find('button#crudSave').simulate('click');
    });
})

describe("NodeFormView", ()=>{
    const wrapper = mount( renderWithRedux(
        <ReflectDescription />
    ));

    it('The description field saved to globel state (Redux) is reflected properly',()=>{ 
        expect(wrapper.find('div#testme').first().text()).toEqual(sampleDescriptionFieldValue);
    });
})
