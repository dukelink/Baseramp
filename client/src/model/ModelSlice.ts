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
import { buildOutline } from './ModelOutline';
import { testModelData } from './testModel';
import { buildDerived, loadData } from './ModelDerived';
import { Model, Records, RecordOfAnyType } from './ModelTypes';

let initialState : Model = {
  apiModel: {},
  derivedModel: {},
  metaModel: { // TODO: temporarily duplicated from apiModel for now
    AppTable : {},
    AppColumn : {}
  },
  outline: [],
  inactive_status_ids: [],
  inprogress_status_ids: []
};

const model = createSlice({
  name: 'model',
  initialState,
  reducers: {
    metaload(state,action:PayloadAction<Records<any>>) {
      Object.assign(state.metaModel,action.payload);
    },
    load(state,action:PayloadAction<Records<any>>) { 
      loadData(state,action.payload);
      state.outline = buildOutline(state.derivedModel,true/*we always load with filter on for now*/); 
    },
    refreshRecordInVM(state,action:PayloadAction<{
        navTable:string,navTableID:string,navActiveFilter:boolean,recordDelta:RecordOfAnyType}>) {
      const { navTable, navTableID, navActiveFilter, recordDelta } = action.payload;
      Object.assign(state.apiModel[navTable][navTableID], recordDelta); 
      buildDerived(state);
      switch (navTable) {
        case 'AppTable' :
          Object.assign(state.metaModel.AppTable[navTableID], recordDelta);
          break;
        case 'AppColumn' :
          Object.assign(state.metaModel.AppColumn[navTableID], recordDelta);
          break;
      } 
      state.outline = buildOutline(state.derivedModel,navActiveFilter);
    },
    addRecordToVM(state,action:PayloadAction<{navTable:string,navActiveFilter:boolean,record:RecordOfAnyType}>) {
      const { navTable, navActiveFilter, record } = action.payload;
      const navTableID = record[navTable+'_id'];
      state.apiModel[navTable][navTableID] = record;
      buildDerived(state);
      state.outline = buildOutline(state.derivedModel,navActiveFilter);
    }, 
    deleteRecordFromVM(state,action:PayloadAction<{navTable:string,navTableID:string,navActiveFilter:boolean}>) {
      const { navTable, navTableID, navActiveFilter } = action.payload;
      delete state.apiModel[navTable][navTableID];
      buildDerived(state);
      state.outline = buildOutline(state.derivedModel,navActiveFilter);
    },
    setActiveItemDisplay(state,action:PayloadAction<{navActiveFilter:boolean}>) {
      state.outline = buildOutline(state.derivedModel,action.payload.navActiveFilter);
    },
    setTestDataModeReducer(state,action:PayloadAction<{testDataMode:boolean}>) {
      if (action.payload.testDataMode) {
        loadData(state,testModelData.apiModel); 
        state.outline = buildOutline(state.derivedModel,true/*we always load with filter on for now*/); 
      }
    },
    clearModelReducer(state) {
      // Reset everything to initial state, except for meta data which we will retain...
      Object.assign(state, {...initialState, metaModel: state.metaModel}); 
    }
  }
});

export const { 
  metaload,
  load, 
  refreshRecordInVM, 
  addRecordToVM, 
  deleteRecordFromVM, 
  setActiveItemDisplay, 
  setTestDataModeReducer,
  clearModelReducer
} = model.actions;

export default model.reducer; 
