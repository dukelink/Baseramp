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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OutlineNode } from '../../model/ModelOutline';
import { Records, AuditUpdate } from '../../model/ModelTypes';

export interface INavigateState {
  navTable: string;
  navTableID: string;
  navParentTable: string;
  navStrParentID: string;
  navActiveFilter : boolean;
  navShowAdminTables : boolean;
  lastAuditTableID : number,
  testDataMode: boolean;
};

let initialState : INavigateState = {
    navTable: "",
    navTableID: "",
    navParentTable: "",
    navStrParentID: "",
    navActiveFilter: true,
    navShowAdminTables: false,
    lastAuditTableID:-1,
    testDataMode: false
};

type INavigateRecordFocus = Pick<OutlineNode,'table'|'tableID'|'parentTable'|'parentID'>;

const model = createSlice({
  name: 'model',
  initialState,
  reducers: {
    load(state, action:PayloadAction<Records<any>>) { 
      const records = action.payload;
      //console.log(JSON.stringify(records['audit']))
      state.lastAuditTableID = Number.parseInt(
            Object.keys(records['audit'])[0] // (highest audit_id)
        ) || -1;  // -1 is just any low value that we can spot as 'uninitialized'
                  // (Unlikely to occur as the audit table will always have some data)
    },   
    refresVMfromAuditRecords(state, 
      action:PayloadAction<{navigate:INavigateState,audit_updates:AuditUpdate[]}>)
    {
      const { navigate, audit_updates } = action.payload;
      if (audit_updates.length)
        state.lastAuditTableID = 
            Object.values(audit_updates).slice(-1)[0].audit_id
              || navigate.lastAuditTableID; // REVIEW: Consider MAX for safety's sake!
    },
    setFocus(state, action: PayloadAction<INavigateRecordFocus>) {
      let { table, tableID, parentTable, parentID } = action.payload;
      // HACK: XREF...
      if (table==='Project Sprint') {
        table = 'project';
        if (tableID && tableID !== '-1' && typeof tableID==='string')
          tableID = tableID.split('-')[0]; // Extract product_id value only
      }
      // ... HACK: XREF
      state.navTable = table||"";
      state.navTableID = (tableID||"").toString();
      state.navParentTable = (parentTable||"");
      state.navStrParentID = (parentID||"").toString();
    },
    addNewBlankRecordForm(state,action:PayloadAction<{navTable:string}>) {
      state.navTableID = '-1';
      console.log('ADD NEW BLANK RECORD');
    },
    addRecordToVM(state,action:PayloadAction<{navigate:INavigateState, record:any}>) {
      const { navigate: { navTable }, record } = action.payload;
      state.navTableID = record[navTable+'_id'];
    }, 
    setActiveItemDisplay(state,action:PayloadAction<{navigate : INavigateState}>) {
      console.log(`set acvtive item display: ${JSON.stringify(action.payload)}`)
      Object.assign(state, action.payload.navigate);
    },
    setTestDataModeReducer(state,action:PayloadAction<{navigate: INavigateState}>) {
      Object.assign(state, action.payload.navigate);
    },
    deleteRecordFromVM(state,action:PayloadAction) { 
      state.navTableID = '';
    },
    clearModelReducer(state) {
      // Reset everything to initial state, except for meta data which we will retain...
      Object.assign(state, initialState); 
    }    
  }
});

export const { 
  addNewBlankRecordForm, 
  setActiveItemDisplay, 
  setTestDataModeReducer,
  setFocus
} = model.actions;

export default model.reducer; 
