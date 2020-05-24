/*
    Baseramp - A database for end users enabling personal and private data ownership,
    built as a Progressive Web Application (PWA) using
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

import React from 'react';
import { Provider, ConnectedComponent } from 'react-redux';
import store from '../../store';
import { NodeFormView } from './NodeFormView';
import { NodeForm } from './NodeForm';

import { addNewBlankRecordForm, setFocus } from '../SystemNavigator/NavigateSlice';
import  Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import { FormControl, TextField, Select, MenuItem, InputLabel }
  from '@material-ui/core';
import { setTestDataMode } from '../../model/ModelThunks';

configure({ adapter: new Adapter() });

// Suppress console.log() messages during unit testing...
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

const tableToTest = 'AppColumn';
store.dispatch(setTestDataMode(true));
store.dispatch(setFocus({table: tableToTest, tableID: ''}));  
store.dispatch(addNewBlankRecordForm({navTable:tableToTest}));

describe("NodeFormView - adding new records", ()=>{
    const wrapper = mount( renderWithRedux(
        <NodeFormView />
    ));
    it('Add New renders a blank form with the expected number and type of controls',()=>{ 
        expect(wrapper.find(FormControl)).toHaveLength(11);
        expect(wrapper.find(TextField)).toHaveLength(9);
        expect(wrapper.find(Select)).toHaveLength(2);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(InputLabel)).toHaveLength(13);
    });
})

store.dispatch(setFocus({table: 'AppColumn', tableID: '-1'}));  

describe("NodeFormView", ()=>{
    const fk_field='AppColumn_AppTable_id';
    const fk_valid_value='AppTable';
    const wrapper = mount( renderWithRedux(
        <NodeForm 
            navTable={ tableToTest } 
            navTableID='AppColumn_AppTable_id' 
            record={ { [fk_field] : fk_valid_value } } />
    ));
    it('Test that an existing foreign key renders',()=>{ 
        // Valid foreign key (display) values will be reflect in the Material-UI Select control...
        expect(wrapper.find('span#AppField_AppColumn_AppTable_id')
        .find('div').children()
        .find('div').children()
        .find('div').children().first().text()).toEqual(fk_valid_value);
    });
})

describe("NodeFormView", ()=>{
    const fk_field='AppColumn_AppTable_id';
    const fk_valid_value='**BAD**';
    const wrapper = mount( renderWithRedux(
        <NodeForm 
            navTable={ tableToTest } 
            navTableID='AppColumn_AppTable_id' 
            record={ { [fk_field] : fk_valid_value } } />
    ));
    it('Test that a non existing foreign key fails to render',()=>{ 
        // Invalid foreign key (display) values will NOT be reflect in the Material-UI Select control...
        const renderText = (wrapper.find('span#AppField_AppColumn_AppTable_id')
            .find('div').children()
            .find('div').children()
            .find('div').first().text());
        // Material-UI is rendering zero-length, no-break space (8203) for Select with a bad FK value   
        expect(renderText.charCodeAt(0)).toEqual(8203); 
    });
});

store.dispatch(setFocus({table: 'AppColumn', tableID: 'AppColumn_AppTable_id'})); 
describe("NodeFormView - recalling records", ()=>{
    const wrapper = mount( renderWithRedux(
        <NodeFormView />
    ));
    it('Recall renders a form with the expected number and type of controls',()=>{ 
        expect(wrapper.find(FormControl)).toHaveLength(11);
        expect(wrapper.find(TextField)).toHaveLength(9);
        expect(wrapper.find(Select)).toHaveLength(2);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(InputLabel)).toHaveLength(13);
    });

    const textFieldValues = (wrapper.find(TextField).children().reduce( (prev,node)=>{
        prev.push(node.get(0).props.value);
        return prev;
    } ,[] as string[]));
    //
    it('Properly recalls and renders text field values',()=>{
        expect(JSON.stringify(textFieldValues)).toEqual(
            '["AppColumn_AppTable_id","",10005,"","AppColumn_AppTable_id","NO","integer","",""]'
        )   
    });

    const selectFieldValues = (wrapper.find(Select).children().reduce( (prev,node)=>{
        prev.push(node.get(0).props.value);
        return prev;
    } ,[] as string[]));
    //
    it('Properly recalls and renders text field values',()=>{
        expect(JSON.stringify(selectFieldValues)).toEqual(
            '["AppColumn","AppTable_id"]'
        )   
    });
});

