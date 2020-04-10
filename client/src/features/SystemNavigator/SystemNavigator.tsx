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

import React, { useState } from 'react';
import { Paper, Grid, IconButton } from '@material-ui/core';
import { NodeFormView } from '../NodeForm/NodeFormView';
import { useNavPanelStyles } from './SystemNavigatorStyles';
import { useWindowSize } from '../../utils/utils';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../rootReducer'; 

import { NodeFormEditState } from '../NodeForm/NodeForm';

import { updateRecord, insertRecord, deleteRecord } from '../../model/ModelThunks';
import { recordDelta } from '../../utils/utils';
import { Button } from '@material-ui/core';
import { addNewBlankRecordForm, setFocus } from './NavigateSlice';

import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';

import { Outline } from './TreeviewOutline';

type EditMode = 'Outline' | 'Edit' | 'Both';

const VerticalSpace = (props:{pixels:number}) => (
  <div style={{
      display: 'inline-block', 
      height: props.pixels, 
      width: '100%' }}>
    &nbsp; {/* Some browsers need content for spacer to work... */}
  </div>);

export const SystemNavigator = () => {
  const classes = useNavPanelStyles();
  const state = useSelector<RootState,RootState>(state=>state);
  const dispatch = useDispatch();
  const { navTable, navTableID, navParentTable, navStrParentID } = state.navigate;

  const [latestNodeformState, setLatestNodeformState] = useState<NodeFormEditState>(
      new NodeFormEditState(navTableID!=="-1") // init dummy value of correct type
  );

  const { record, isFormValid, originalRecord } = latestNodeformState;

  let { outline } = state.model; 
  const [ mode, setMode ] = useState<EditMode>('Both');
  const [ width ] = useWindowSize();
  const otherMode = mode==='Outline' ? 'Edit' : 'Outline';
  const otherLabel = mode==='Outline' ? 'Form' : 'Outline';

  // If not Admin mode, filter out top level tables that are
  // not present for non-admin users...
  if (state.userLogin?.role_title !== 'Admin')
    outline = outline.filter((outlineNode)=>(outlineNode.table 
      && state.model.metaModel['AppTable'][outlineNode.table].role_title==='User'))

  // Does navTable physically exist in apiModel?
  // if not then we'll suppress CRUD buttons for virtually created xref tables
  // HACK XREF...
  const notVirtualXrefTable = state.model.apiModel[navTable] !== undefined; 

  console.log(`SystemNavigator:: navTable: ${navTable}, navTableID: ${navTableID}`);

  if (width >= 960 && mode!=="Both") 
    // NOTE: 960 must exactly match Material-UI 'md' breakpoint
    // REVIEW: Does this md=960px apply for all device types?
    setMode("Both");
  else if (width < 960 && mode==="Both")
    setMode("Outline");

  return ( 
    <Grid container spacing={0}>

      {/* Outline/Edit Navigation Bar */}
      <Grid item xs = {12} 
            className = { classes.OutlineEditButton } 
            style = {{ display: navTable ? 'inline-block' : 'none'  }}> 
        { notVirtualXrefTable &&
          <div 
                color='secondary'
                style = {{ 
                  width: '100%', 
                  visibility: navTable ? 'visible' : 'hidden' }}>
            { 
              (mode !== "Both" && navTableID ) &&
                <IconButton area-label="Navigation Outline"
                    style = {{ padding: 6 }} 
                    onClick = { () => { setMode(otherMode) } }>
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
              { ( ( !navTableID 
                    || JSON.stringify(originalRecord)===JSON.stringify(record) )
                  && navTableID!=='-1') ? <>
                <Button 
                    variant='contained' 
                    onClick = { () => {
                        dispatch(addNewBlankRecordForm({navTable}));
                        console.log(mode);
                        setMode(mode==='Both'?mode:'Edit'); 
                    } } >
                    Add New
                    { (navTable===navParentTable ? ' Sub-' : ' ') // HACK: CYCLIC RELATIONSHIPS
                      + navTable 
                    }
                </Button> 

                { navTableID &&
                  <Button 
                    id="crudDelete" 
                    variant='contained' 
                    onClick={ () => {
                      dispatch(deleteRecord(state.navigate));
                      setMode(mode==='Both'?mode:'Outline');
                    } } > 
                    Delete 
                  </Button>                
                }
              </> : 
              navTableID && <>
                <Button
                    id="crudSave" 
                    variant='contained' 
                    disabled={ !isFormValid }
                    onClick={ () => {
                        if (!isFormValid) {
                            alert('Please fill in all required fields before saving');
                            return;
                        }
                        if (navTableID==="-1") 
                            dispatch(insertRecord(state.navigate, record));
                        else
                            dispatch(updateRecord(state.navigate,
                                recordDelta(record, originalRecord)));                 
                }}> Save </Button> 
                <Button 
                    id="crudCancel" variant='contained'
                    onClick={ ()=> { 
                      // Trigger rerender of NodeForm
                      // (requires props to change, so a clear and restore ID)
                      dispatch(setFocus({ 
                        table:navTable, 
                        tableID: '', 
                        parentTable: navParentTable,
                        parentID: navStrParentID 
                      }));
                      if (navTableID === '-1')
                        setMode(mode==='Both'?mode:'Outline');
                      else
                        dispatch(setFocus({ 
                          table: navTable, 
                          tableID: navTableID,
                          parentTable: navParentTable,
                          parentID: navStrParentID 
                        }));
                    }
                }> Cancel </Button>
              </>}
            </div>
          </div>
        }
      </Grid> 

      {/* Outline Panel/Form */}
      <Grid item xs={12} md={ navTableID ? 6 : 12 } 
          style={{
            display: mode!=='Edit' ? 'inline-block' : 'none' }}>
        <Paper className={classes.paperFullHeight} component="div" >
          <Outline outline={ outline }/>
          <VerticalSpace pixels={80}/>
        </Paper>        
      </Grid>

      {/* Edit Panel/Form */}
      <Grid item xs={12} md={ navTableID ? 6 : 'auto' } 
          style={{
            display: mode!=='Outline' ? 'inline-block' : 'none' }}>
        <Paper className={classes.paperFullHeight}
              style={{  
                display: mode!=='Outline' && navTable
                  ? 'inline-block' : 'none'}}> 
            <NodeFormView dispatch = {setLatestNodeformState} /> 
            <VerticalSpace pixels={80}/>
        </Paper>
      </Grid>

    </Grid>
  );
}

