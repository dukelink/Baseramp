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

import { Settings } from '../Settings';
import store, { AppThunk } from  '../store';
import { Fetch } from '../utils/Fetch';
import { load, refreshRecordInVM, addRecordToVM, deleteRecordFromVM, setTestDataModeReducer, clearModeReducer }
     from './ModelSlice';
import { testModelData } from '../model/testModel';

type AppStore = typeof store;

export const initialLoad = (route:string="all") => {
  Fetch(Settings.serverURL + route)
  .then(res => res && res.json())
  .then(res => {
      store.dispatch(load(res));
      return res;
  })
  .catch((error) =>{});
}

export const updateRecord = (navTable:string,navTableID:string,recordDelta:any) 
    : AppThunk => async dispatch => {
  if (Object.keys(recordDelta).length) {
    if (process.env.NODE_ENV==='test') {
      dispatch(refreshRecordInVM({navTable,navTableID,recordDelta}));
    } else
      Fetch(Settings.serverURL + navTable + '/' + navTableID, {
          method: 'PUT',
          body: JSON.stringify(recordDelta),
          headers: { 'Content-Type': 'application/json' }
      })
      .then(res => dispatch(refreshRecordInVM({navTable,navTableID,recordDelta})))
      .catch((error) =>{});
  }
}

export const insertRecord = (navTable:string,record:any) 
    : AppThunk => async dispatch => {
  if (Object.keys(record).length) {
    Fetch(Settings.serverURL + navTable, { 
        method: 'POST', 
        body: JSON.stringify(record),
        headers: { 'Content-Type': 'application/json' }                        
    })
    .then(res => res && res.json())
    .then(res => dispatch(addRecordToVM({navTable,record:res[0]})))
    .catch((error) =>{}) 
  }
}

export const deleteRecord = (navTable:string, navTableID:string)
    : AppThunk => async dispatch => {
  Fetch( Settings.serverURL + navTable + '/' + navTableID,
      { method: 'DELETE' }
  )
  .then(res => dispatch(deleteRecordFromVM({navTable,navTableID})))
  .catch((error) =>{})
}

export const setTestDataMode = (testDataMode:boolean) : AppThunk => dispatch => {
  dispatch(clearModeReducer());
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