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

import { Environment } from '../environment';
import store, { AppThunk } from  '../store';  // REVIEW: Are there any anti-patterns associated with thunks being state-aware?
import { Fetch } from '../utils/Fetch';
import  { metaload, load, 
          refreshRecordInVM, 
          addRecordToVM, 
          deleteRecordFromVM, 
          setTestDataModeReducer, 
          clearModelReducer 
        } from './ModelSlice';
    
import { testModelData } from './testModel';

export const initialLoad = (route:string="all") => 
{
  Fetch(Environment.serverURL + route)
  .then(res => res && res.json())
  .then(res => {
      store.dispatch(load(res));
      return res;
  })
  .catch((error) =>{});
}

export const loadMetadata = () => 
{
  Fetch(Environment.serverURL + 'meta')
  .then(res => res && res.json())
  .then(res => {
      store.dispatch(metaload(res));
      return res;
  })
  .catch((error) =>{});
}

export const updateRecord = (navTable:string,navTableID:string,recordDelta:any) 
  : AppThunk => async dispatch => 
{
  const state = store.getState(); // TODO: not SSR compatible; consider changing
  const navActiveFilter = state.navigate.navActiveFilter;
  let err = false;

  if (Object.keys(recordDelta).length) {
    if (!state.navigate.testDataMode) {
      await Fetch(Environment.serverURL + navTable + '/' + navTableID, {
          method: 'PUT',
          body: JSON.stringify(recordDelta),
          headers: { 'Content-Type': 'application/json' }
      }).then().catch((error) =>{ err = true; });
    }

    if (!err)
      dispatch(refreshRecordInVM({navTable,navTableID,navActiveFilter,recordDelta}));
  }
}

export const insertRecord = (navTable:string,record:any) 
  : AppThunk => async dispatch => 
{
  const state = store.getState(); // TODO: not SSR compatible; consider changing
  const navActiveFilter = state.navigate.navActiveFilter;
  let err = false;

  if (Object.keys(record).length) {
    if (!state.navigate.testDataMode) 
    {
      await Fetch(Environment.serverURL + navTable, { 
        method: 'POST', 
        body: JSON.stringify(record),
        headers: { 'Content-Type': 'application/json' }                        
    })
      .then(res => res && res.json())
      .then(res => {
        // Grab committed record from server that will be populated with
        // a primary key field, and any other fields computed server-side... 
        record = res[0] 
      })
      .catch((error) =>{ err = true; }) 
    } 
    else // test mode: compute temporary/mock primary key...
    {
      const newTempPKID = Math.min(-1,...Object.keys(state.model.apiModel[navTable]).map((id:string)=>Number.parseInt(id))) - 1;
      console.log(`New temp PKID = ${newTempPKID}`);
      record[navTable+'_id'] = newTempPKID.toString();
    }

    if (!err)
      dispatch(addRecordToVM({navTable,navActiveFilter,record}))
  }
}

export const deleteRecord = (navTable:string, navTableID:string)
  : AppThunk => async dispatch => 
{
  const state = store.getState(); // TODO: not SSR compatible; consider changing
  const navActiveFilter = state.navigate.navActiveFilter;
  let err = false;

  if (!state.navigate.testDataMode)   
    await Fetch( Environment.serverURL + navTable + '/' + navTableID,
        { method: 'DELETE' }
    ).then().catch((error) =>{ err = true; });

  if (!err)
    dispatch(deleteRecordFromVM({navTable,navTableID,navActiveFilter}))
}

export const setTestDataMode = (testDataMode:boolean) 
    : AppThunk => dispatch => 
{
  dispatch(clearModelReducer());
  dispatch(setTestDataModeReducer({testDataMode}));

  // COMMENT OUT TO GET FRESH TEST MODEL...
  if (testDataMode)
    dispatch(load(testModelData.apiModel)); 
  else {
  // ...COMMENT OUT
    initialLoad(testDataMode?"test":"all"); 
  }
  //
  // TODO: Clear current navigation focus
  //
}