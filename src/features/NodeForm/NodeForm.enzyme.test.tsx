import React, { ComponentType } from 'react';
import { Provider, connect, ConnectedComponent } from 'react-redux';
import { compose } from 'redux';
import store from '../../store';
import { RootState } from '../../rootReducer';
import { NodeForm, AddNewFormButton, NodeFormProps } from './NodeForm';
import Button from '@material-ui/core/Button';

import  Adapter from 'enzyme-adapter-react-16';
import { configure, mount, ReactWrapper } from 'enzyme';
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

const tableToTest = 'AppColumn';

const NodeFormWithReflectedDescriptionField = (props:NodeFormProps) => <>
    <NodeForm {...props} />
    <div id='testme'>
        { props.record.AppColumn_description }
    </div>
</>;

function mapStateToProps(state: RootState, ownProps: NodeFormProps):NodeFormProps {
    const navTableID = ownProps.navTableID || state.model.navigate.navTableID;
    const record = state.model.apiModel[tableToTest][navTableID] || {};
    return { 
        navTable: tableToTest, 
        navTableID, 
        record, 
        ...ownProps 
    }
}
const ConnectedNodeForm = compose<ComponentType<any>>(connect(mapStateToProps))(NodeForm);

describe(NodeForm, ()=>{
    const wrapper = mount( renderWithRedux(
        <ConnectedNodeForm />
    ));   
    it('Renders the Add New button only if no record ID given',()=>{ 
        expect(wrapper.find(AddNewFormButton).getElement()).toEqual(<AddNewFormButton navTable={tableToTest} />); 
    });
    it(`Add New ${tableToTest} button contains the expected label text`,()=>{ 
        expect(wrapper.find(NodeForm).first().text()).toEqual(`Add New ${tableToTest}`); 
    });
    it('Depressing Add New renders a blank form with the expected number and type of controls',()=>{ 
        wrapper.find(Button).simulate('click');
        expect(wrapper.find(FormControlLabel)).toHaveLength(2);
        expect(wrapper.find(FormControl)).toHaveLength(11);
        expect(wrapper.find(TextField)).toHaveLength(9);
        expect(wrapper.find(Select)).toHaveLength(2);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(InputLabel)).toHaveLength(11);
    });
})

const ConnectedNodeFormWithReflectedDescriptionField = compose<ComponentType<any>>(connect(mapStateToProps))(
    NodeFormWithReflectedDescriptionField );

describe(NodeForm, ()=>{
    const wrapper = mount( renderWithRedux(
        <ConnectedNodeFormWithReflectedDescriptionField navTableID="AppColumn_AppTable_id" />
    ));
    it('Entering the description field and pressing Save correctly updates global state',()=>{ 
        const sampleDescriptionFieldValue = 'Hello @ @';
        // Enter the specific test value above into the AppColumn description field
        wrapper.find('span#AppField_AppColumn_description textarea').first()
            .simulate('change', { target: { value: sampleDescriptionFieldValue } });
        // Depress the "save" button on the form
        wrapper.find('button#crudSave').first().simulate('click');
        // Confirm that the test value is reflected to our test control, which
        // requires the value to round-trip from our global, redux store...
        expect(wrapper.find('div#testme').first().text()).toEqual(sampleDescriptionFieldValue);
    });
})

describe(NodeForm, ()=>{
    const fk_field='AppColumn_AppTable_id';
    const fk_valid_value='AppTable';
    const wrapper = mount( renderWithRedux(
        <ConnectedNodeForm 
            navTableID="AppColumn_AppTable_id" 
            record={{[fk_field]: fk_valid_value}} // Test a known good foreign key value
            />
    ));
    it('Test that an existing foreign key renders',()=>{ 
        // Valid foreign key (display) values will be reflect in the Material-UI Select control...
        expect(wrapper.find('span#AppField_AppColumn_AppTable_id')
            .find('div').children()
            .find('div').children()
            .find('div').children().first().text()).toEqual(fk_valid_value);
    });
})

describe(NodeForm, ()=>{
    const fk_field='AppColumn_AppTable_id';
    const wrapper = mount( renderWithRedux(
        <ConnectedNodeForm 
            navTableID="AppColumn_AppTable_id" 
            record={{[fk_field]: '*BAD*'}} // A known "bad", foreign key value
            />
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
})
