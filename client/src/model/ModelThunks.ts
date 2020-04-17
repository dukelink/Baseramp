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

import { Environment } from '../environment';
import store, { AppThunk } from  '../store';  // REVIEW: Are there any anti-patterns associated with thunks being state-aware?
import { Fetch } from '../utils/Fetch';
import { recordDelta } from '../utils/utils';
import  { metaload, load, 
          refresVMfromAuditRecords,
          refreshRecordInVM, 
          addRecordToVM, 
          deleteRecordFromVM, 
          setTestDataModeReducer, 
          clearModelReducer 
        } from './ModelSlice';
import { INavigateState } from '../features/SystemNavigator/NavigateSlice';
import { testModelData } from './testModel';
import { RecordOfAnyType } from './ModelTypes';

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
  //console.log('loadMetadata()');
  Fetch(Environment.serverURL + 'meta')
  .then(res => res && res.json())
  .then(res => {
      store.dispatch(metaload(res));
      return res;
  })
  .catch((error) =>{});
}

export const updateRecord = (navigate:INavigateState, recordDelta:any) 
  : AppThunk => async dispatch => 
{
  const { navTable, navTableID } = navigate;

  // NOTE/REVIEW: not SSR compatible; but convinient for easy/quick/fast
  // access to Redux global store...  
  const state = store.getState();

  let err = false;
  let record : RecordOfAnyType = {};

  if (Object.keys(recordDelta).length) {
    if (!state.navigate.testDataMode) {
      await Fetch(Environment.serverURL + navTable + '/' + navTableID, {
          method: 'PUT',
          body: JSON.stringify(recordDelta),
          headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res && res.json())
      .then(res => {
        // Grab committed record from server that will be populated with
        // any other fields computed server-side... 
        record = res[0] 
      })
      .catch((error) =>{ err = true; });
    }

    if (!err)
      dispatch(refreshRecordInVM({navigate,record}));
  }
}

export const refreshFromServer = (navigate:INavigateState) =>
//  : AppThunk => async dispatch => 
{
  if (navigate.lastAuditTableID !== -1) {
    //console.log(`refreshFromServer(${JSON.stringify(navigate)})`);
    Fetch(Environment.serverURL + `audit_updates/${navigate.lastAuditTableID}`)
    .then(res => res && res.json())
    .then(res => {
        store.dispatch(refresVMfromAuditRecords({navigate,audit_updates:res}));
        return res;
    })
    .catch((error) =>{});
  }
}

export const insertRecord = (navigate:INavigateState, _record:RecordOfAnyType) 
  : AppThunk => async dispatch => 
{
  const { navTable } = navigate;
  let err = false;

  // HACK: XREF - I have a business rule in recordDelta that filters out 
  // derived key fields...  I may move the rule elsewhere later...
  let record = recordDelta(_record,{}); 

  if (Object.keys(record).length) {
    if (!navigate.testDataMode) 
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

    if (!err)
      dispatch(addRecordToVM({navigate,record})) 
  }
}

export const deleteRecord = (navigate: INavigateState)
  : AppThunk => async dispatch => 
{
  const { navTable, navTableID, testDataMode } = navigate;
  let err = false;

  if (!testDataMode)   
    await Fetch( Environment.serverURL + navTable + '/' + navTableID,
        { method: 'DELETE' }
    ).then().catch((error) =>{ err = true; });

  if (!err)
    dispatch(deleteRecordFromVM({navigate}))
}

export const setTestDataMode = (navigate: INavigateState) 
    : AppThunk => dispatch => 
{
  dispatch(clearModelReducer());
  dispatch(setTestDataModeReducer({navigate}));

  if (navigate.testDataMode)
    dispatch(load(testModelData.apiModel)); 
  else {
    initialLoad("all"); 
  }
  //
  // TODO: Clear current navigation focus
  //
}