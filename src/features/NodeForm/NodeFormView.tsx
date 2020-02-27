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

import React, { useRef, useState, MutableRefObject } from 'react';
import { NodeForm, NodeFormEditState, NodeFormEditState_OnChange } from '../NodeForm/NodeForm';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../rootReducer'; 
import { RecordOfAnyType, useInitializedRecord } from '../../model/ModelSlice';
import { addNewBlankRecordForm } from '../../features/SystemNavigator/NavigateSlice'
import { updateRecord, insertRecord, deleteRecord } from '../../model/ModelThunks';
import { recordDelta, properCase } from '../../utils/utils';
import { Container, Button, Typography } from '@material-ui/core';

export const NodeFormView = () => {
    const state = useSelector<RootState,RootState>(state=>state);
    let { navTable, navTableID, navParentTable, navStrParentID } = state.navigate;
    const viewModel = state.model.apiModel;
    const dispatch = useDispatch();
    const initialRecord : RecordOfAnyType = useInitializedRecord(navTable); // TODO: should we memoize?

    // The following callback reference is designed to be set within
    // the block of controls that operate on the NodeForm, i.e. CrudButtons...
    let nodeFormCallbackRef = useRef<NodeFormEditState_OnChange>(()=>{/*dummy*/}); 

    console.log(`<NodeFormView/> navTable: ${navTable}, navTableID: ${navTableID}
                 (Duplicate calls to this and AppField(s) due to desktop 
                  and mobile views hidden only by CSS at the moment)
                  initialRecord = ${JSON.stringify(initialRecord)}`);

    // HACK: XREF FEATURE...
    // handle xref derived (hyphenated) table names by return parent table info...
    let xref_node = false;
    if (navTable.split('~').length>1) 
    {
        xref_node = true;
        navTable = navTable.split('~')[0];    
        navTableID = navTableID.split('~')[0]; // xref support
    }
    // HACK: ...XREF FEATURE

    let record : RecordOfAnyType = {};
    if (navTable) { 
        if (navTableID!=="-1") 
            record = viewModel[navTable][navTableID];
        else {
            record = {...initialRecord};
            if (navParentTable && navStrParentID) {
                // HACK: XREF FEATURE...
                navParentTable = navParentTable.split('~')[0];  
                navStrParentID = navStrParentID.split('~')[0];
                // HACK: ...XREF FEATURE
                record[navTable + '_' + navParentTable + '_id'] = navStrParentID;
            }
        }
    }

    if (!navTable || (xref_node && !navTableID)) // TODO: Comment needed...
        return <></>;
    else {
        let elements : JSX.ElementAttributesProperty[] = [];
        if (navTable) {
            elements.push(
                <h2 style={{width:"100%"}} key='1'>
                    { properCase(navTable) } Record 
                </h2>
            )
            if (!navTableID) {
                elements.push(
                    <Button 
                        variant='contained' 
                        key='2' 
                        onClick = { 
                            () => dispatch(addNewBlankRecordForm({navTable})) 
                    } >
                        Add New { navTable }
                    </Button>            
                )                
            } else {
                elements.push(
                    <NodeForm 
                        navTable = { navTable } 
                        navTableID = { navTableID }
                        record = { record } 
                        onChange = { (rec)=>nodeFormCallbackRef.current(rec) } 
                        key='3'/>
                )
                elements.push(
                    <CrudButtons 
                        navTable={navTable} 
                        navTableID={navTableID} 
                        record={record} 
                        callbackRef={ nodeFormCallbackRef } 
                        key='4'/>           
                )
            }
        }
        return <>{elements}</>; 
    }
}

const CrudButtons = (
    props:{ 
        navTable:string,
        navTableID:string,
        record:RecordOfAnyType,
        callbackRef:MutableRefObject<NodeFormEditState_OnChange>
    }
) => {
    const dispatch = useDispatch();
    const { navTable, navTableID, record : propRecord, callbackRef } = props;
    const [state, setState] = useState<NodeFormEditState>(
        new NodeFormEditState(navTableID!=="-1")
    );
    const { record, isFormValid } = state;
    console.log('CrudButtons');
    
    callbackRef.current = (newState:NodeFormEditState) => { setState(newState); }

    return (
        <Container maxWidth="xl">
            <Typography component="div" style={{ paddingTop: '50px', textAlign: 'left' }}>
            <Button
                id="crudSave" 
                variant='contained' 
                disabled={!isFormValid}
                onClick={ () => {
                    if (!isFormValid) {
                        alert('Please fill in all required fields before saving');
                        return;
                    }
                    if (navTableID==="-1") 
                        dispatch(insertRecord(navTable, record));
                    else
                        dispatch(updateRecord(navTable, navTableID,
                            recordDelta(record, propRecord)));                    
                }}>
                Save
            </Button> 
            <span style={{minWidth: 20, display: 'inline-block'}} />
            <Button 
                id="crudDelete" 
                variant='contained' 
                onClick={ () => dispatch(deleteRecord(navTable, navTableID)) }>
                Delete
            </Button>
            <span style={{minWidth: 20, display: 'inline-block'}} />
            <Button id="crudCancel" variant='contained'>
                Cancel
            </Button>
            </Typography>
        </Container>
    )
}
