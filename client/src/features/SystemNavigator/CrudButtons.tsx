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

import React, { useState, Dispatch, SetStateAction } from 'react';

import { Grid, IconButton, Paper } from '@material-ui/core';
import { Button } from '@material-ui/core';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import { useNavPanelStyles } from './SystemNavigatorStyles';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../rootReducer'; 
import { NodeFormEditState } from '../NodeForm/NodeForm';
import { EditMode } from './SystemNavigator';
import { updateRecord, insertRecord, deleteRecord } from '../../model/ModelThunks';
import { addNewBlankRecordForm, setFocus } from './NavigateSlice';
import { useTableAppCols } from '../../model/ModelSelectors';

import { recordDelta } from '../../utils/utils';

import { RecordOfAnyType } from '../../model/ModelTypes';

export const CrudButtons = ( props: {
  latestNodeformState: NodeFormEditState,
  setLatestNodeformState: Dispatch<SetStateAction<NodeFormEditState>>,
  mode: EditMode, setMode: Dispatch<SetStateAction<EditMode>>,
  origRecord: RecordOfAnyType
  } 
) => {
  const { setLatestNodeformState, mode, setMode } = props;
  const { isFormValid } = props.latestNodeformState;      

  const classes = useNavPanelStyles();
  const state = useSelector<RootState,RootState>(state=>state);
  const dispatch = useDispatch();
  const [ rerenderFlag, setRerenderFlat ] = useState(1);
  const otherMode = mode==='Outline' ? 'Edit' : 'Outline';
  const otherLabel = mode==='Outline' ? 'Form' : 'Outline';

  const { navTable, navTableID, navParentTable, navStrParentID } = state.navigate;

  const tableVisibleFieldNames = useTableAppCols(navTable)
    .filter( appCol => 
      // REVIEW:
      // Filters out ui hidden since they are not needed to drive UI,
      // and MORE IMPORTANTLY, I want to filter recordDelta
      // to only visible fields using this hook, so that we
      // don't try to send fields updates to the server
      // for fields that are not editable (like SQL computed fields)
      !appCol.AppColumn_ui_hidden 
      // REVIEW:
      // Make an exception for the primary key field,
      // as it is used to avoid rendering empty/null records 
      // around lines 56-69 in NodeForm.tsx...
      || appCol.AppColumn_column_name === navTable+'_id'
    )
    .map( appCol => appCol.AppColumn_column_name); 

  const filterOnlyVisibleColumns = (rec:RecordOfAnyType) => {
    const rv : RecordOfAnyType = Object.keys(rec).reduce(
      (prev,colName) => {
        if (tableVisibleFieldNames.includes(colName))
          prev[colName] = rec[colName];
        return prev;
      },{} as RecordOfAnyType);
      return rv;
  }
  const origRecord = filterOnlyVisibleColumns(props.origRecord);
  const record = filterOnlyVisibleColumns(props.latestNodeformState.record);

  const strOrigRecord = JSON.stringify(origRecord, Object.keys(origRecord).sort());
  const strRecord = JSON.stringify(record, Object.keys(record).sort());
  const cleanFlag = (!navTableID || strOrigRecord===strRecord) && navTableID!=='-1';

  return (
    <Grid item xs = {12} className = { classes.OutlineEditButton } > 
      { !navTable ? 
        <Paper className={classes.root}>
          Select an outline item to view, edit or add...
        </Paper> 
        :
        <div color='secondary' style = {{ width: '100%' }}>
          { 
          (mode !== "Both" && navTableID ) &&
            <IconButton area-label="Navigation Outline"
              style = {{ padding: 6 }} 
              onClick = { () => { 
                // TODO: Move handlers out of render...
                setMode(otherMode) } 
              }>
            <div>
              { otherLabel }&nbsp;
            </div> 
            <PlayCircleFilledIcon className = { 
              otherMode==='Outline' ? classes.rotate80 : '' 
            } />
            </IconButton>
          }
          <div  className = { classes.buttonBar }
            style = {{ display: 'inline-block', float: 'right' }} >
            { 
              cleanFlag ?
                <>
                  <Button 
                    variant='contained' 
                    style={{maxWidth:"140px ! important"}}
                    onClick = { () => {
                      // TODO: Move handlers out of render...
                      dispatch(addNewBlankRecordForm({navTable}));
                      console.log(mode);
                      setMode(mode==='Both'?mode:'Edit'); 
                    } } >
                    Add { navTable }
                  </Button> 

                  { navTableID &&
                  <Button 
                    id="crudDelete" 
                    variant='contained' 
                    onClick={ () => {
                      // TODO: Move handlers out of render...
                      dispatch(deleteRecord(state.navigate,state.settings));
                      setMode(mode==='Both'?mode:'Outline');
                    } } > 
                    Delete 
                  </Button>                
                  }
                </> 
              : 
                navTableID && <>
                  <Button
                    id="crudSave" 
                    variant='contained' 
                    disabled={ !isFormValid }
                    onClick={ () => {
                      // TODO: Move handlers out of render...
                      if (!isFormValid) {
                        alert('Please fill in all required fields before saving');
                        return;
                      }
                      if (navTableID==="-1")
                        dispatch(insertRecord(state.navigate, state.settings, record));
                      else {
                        console.log(`ORIGRECORD = ${strOrigRecord}`);
                        console.log(`RECORD = ${strRecord}`);
                        dispatch(updateRecord(state.navigate, state.settings,
                          recordDelta(record, origRecord)));
                      }
                  }}> Save </Button> 
                  <Button 
                    id="crudCancel" variant='contained'
                    onClick={ ()=> { 
                      // TODO: Move handlers out of render...
                      setLatestNodeformState({ 
                        record: origRecord, 
                        isFormValid: true
                      });
                      // Remove form if Add New record form...
                      if (navTableID === '-1') {
                        dispatch(setFocus({ 
                        table:navTable, 
                        tableID: '', 
                        parentTable: navParentTable,
                        parentID: navStrParentID 
                        }));
                        // Return to outline display only...
                        setMode('Outline');
                      } else
                      // If user was editing an existing record, flag rerender...
                        setRerenderFlat(rerenderFlag+1);  
                    }
                  }> Cancel </Button>
                </>
            }
          </div>
        </div>
      }
    </Grid> 
  )
}
