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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OutlineNode } from '../../model/SystemOutline';

interface INavigateState {
  navTable: string;
  navTableID: string;
  navParentTable: string;
  navStrParentID: string;
  navActiveFilter : boolean;
  testDataMode: boolean;
};

let initialState : INavigateState = {
    navTable: "",
    navTableID: "",
    navParentTable: "",
    navStrParentID: "",
    navActiveFilter: true,
    testDataMode: false
};

type INavigateRecordFocus = Pick<OutlineNode,'table'|'tableID'|'parentTable'|'parentID'>;

const model = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setFocus(state, action: PayloadAction<INavigateRecordFocus>) {
      const { table, tableID, parentTable, parentID } = action.payload;
      state.navTable = table||"";
      state.navTableID = (tableID||"").toString();
      state.navParentTable = (parentTable||"");
      state.navStrParentID = (parentID||"").toString();
    },
    addNewBlankRecordForm(state,action:PayloadAction<{navTable:string}>) {
      state.navTableID = '-1';
      console.log('ADD NEW BLANK RECORD');
    },
    addRecordToVM(state,action:PayloadAction<{navTable:string,navActiveFilter:boolean,record:any}>) {
      const { navTable, record } = action.payload;
      state.navTableID = record[navTable+'_id'];
    }, 
    setActiveItemDisplay(state,action:PayloadAction<{navActiveFilter:boolean}>) {
      state.navActiveFilter = action.payload.navActiveFilter;
    },
    setTestDataModeReducer(state,action:PayloadAction<{testDataMode:boolean}>) {
      state.testDataMode = action.payload.testDataMode; 
    },
    deleteRecordFromVM(state,action:PayloadAction<{navTable:string,navTableID:string,navActiveFilter:boolean}>) {
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