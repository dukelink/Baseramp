/*
    Baseramp Tracker - An open source Project Management software built
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

import React, { useState, useEffect } from 'react';

import { Paper, Grid } from '@material-ui/core';
import { useNavPanelStyles } from './SystemNavigatorStyles';
import { useWindowSize, VerticalSpace } from '../../utils/utils';

import { CrudButtons } from './CrudButtons';
import { useSelector } from 'react-redux';
import { RootState } from '../../rootReducer'; 
import { NodeFormEditState } from '../NodeForm/NodeForm';
import { NodeForm } from '../NodeForm/NodeForm';
import { useRecord } from '../../model/ModelSelectors';
import { Outline } from './TreeviewOutline';

export type EditMode = 'Outline' | 'Edit' | 'Both';

export const SystemNavigator = () => {
  const classes = useNavPanelStyles();
  const state = useSelector<RootState,RootState>(state=>state);

  const navigate = state.navigate;
  const { navTable, navTableID, navParentTable, navStrParentID } 
    = navigate;

  // REVIEW: Memoize? Use Reslect? Or just cache within this component...
  const origRecord = useRecord(navTable,navTableID,navParentTable,navStrParentID);

  const initState = new NodeFormEditState(navTableID!=="-1", origRecord);

  const [latestNodeformState, setLatestNodeformState] 
    = useState<NodeFormEditState>(initState);

  let { record } = latestNodeformState;

  //console.log(`ORIG = ${JSON.stringify(origRecord)}`);
  //console.log(`RECO = ${JSON.stringify(record)}`);

  useEffect(()=>{
    setLatestNodeformState(initState)    
  },
  // TODO: Resolve warning about code which works perfectly as-is and only as-is
  // "React Hook useEffect has a missing dependency: 'initState'. Either
  //  include it or remove the dependency array  react-hooks/exhaustive-deps."
  [navTable,navTableID])

  let { outline } = state.model; 
  const [ mode, setMode ] = useState<EditMode>('Both');
  const [ width ] = useWindowSize();

  // If not Admin mode, filter out top level tables that are
  // not present for non-admin users...
  if (state.userLogin?.role_title !== 'Admin')
    outline = outline.filter((outlineNode)=>(outlineNode.table 
      && state.model.metaModel['AppTable'][outlineNode.table].role_title==='User'))

  console.log(`SystemNavigator:: navTable: ${navTable}, navTableID: ${navTableID}, mode: ${mode}`); 

  if (width >= 960 && mode!=="Both") 
    // NOTE: 960 must exactly match Material-UI 'md' breakpoint
    // REVIEW: Does this md=960px apply for all device types?
    setMode("Both");
  else if (width < 960 && mode==="Both")
    setMode("Outline");
  else if (width < 960 && mode==="Edit" && !navTableID)
    setMode("Outline");

  return ( 
    <Grid container spacing={0}>

      {/* CRUD button bar & Outline vs. Form mode for small form factors... */}
      <CrudButtons { ...{
        latestNodeformState, setLatestNodeformState, mode, setMode, origRecord
      } } />

      {/* Outline Panel/Form */}
      <Grid item xs={12} md={ navTableID ? 6 : 12 } 
          style={{
            display: mode!=='Edit' ? 'inline-block' : 'none' }}>
        <Paper className={classes.paperFullHeight} component="div" >
          <Outline outline={ outline }/>
          <VerticalSpace vh={75}/>
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
            {navTable && navTableID && <>
              <NodeForm 
                navTable = { navTable } 
                navTableID = { navTableID }
                activeFilter = { state.settings.activeFilter }
                record = { record }
                dispatch = { setLatestNodeformState } />  
              </>
            }
            <VerticalSpace pixels={80}/>
        </Paper>
      </Grid>

    </Grid>
  );
}
