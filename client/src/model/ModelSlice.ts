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
import { INavigateState } from '../features/SystemNavigator/NavigateSlice';

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
    metaload(model, action:PayloadAction<Records<any>>) {
      Object.assign(model.metaModel,action.payload);
    },
    load(model, action:PayloadAction<Records<any>>) { 
      loadData(model,action.payload);
      model.outline = buildOutline(model.derivedModel, 
        {navActiveFilter:true, navShowAdminTables: false}); 
    },
    refreshRecordInVM(
        model : Model, 
        action:PayloadAction<{navigate:INavigateState,recordDelta:RecordOfAnyType}>) 
    {
      const { navigate, recordDelta } = action.payload;
      const { navTable, navTableID } = navigate;
      Object.assign(model.apiModel[navTable][navTableID], recordDelta); 
      buildDerived(model);
      switch (navTable) {
        case 'AppTable' :
          Object.assign(model.metaModel.AppTable[navTableID], recordDelta);
          break;
        case 'AppColumn' :
          Object.assign(model.metaModel.AppColumn[navTableID], recordDelta);
          break;
      } 
      model.outline = buildOutline(model.derivedModel,navigate);
    },
    addRecordToVM(model, action : 
        PayloadAction<{navigate:INavigateState,record:RecordOfAnyType}>) { 
      const { navigate, record } = action.payload;
      const { navTable } = navigate;
      const navTableID = record[navTable+'_id'];
      model.apiModel[navTable][navTableID] = record;
      buildDerived(model);
      model.outline = buildOutline(model.derivedModel, navigate);
    }, 
    deleteRecordFromVM(model, action : PayloadAction<{navigate:INavigateState}>) 
    {
      const { navTable, navTableID } = action.payload.navigate;
      delete model.apiModel[navTable][navTableID];
      buildDerived(model);
      model.outline = buildOutline(model.derivedModel, action.payload.navigate);
    },
    setActiveItemDisplay(model, action : 
        PayloadAction<{navigate:INavigateState}>) {
      model.outline = buildOutline(model.derivedModel, action.payload.navigate);
    },
    setTestDataModeReducer(model, action : 
        PayloadAction<{navigate:INavigateState}>) {

        // console.log(`setTestDataModeReducer() payload = ${JSON.stringify(action.payload)}`)

      if (action.payload.navigate.testDataMode) {
        loadData(model,testModelData.apiModel); 
        model.outline = buildOutline(model.derivedModel,
          {navActiveFilter:true, navShowAdminTables: true}); 
      }
    },
    clearModelReducer(model) {
      // Reset everything to initial state, except for meta data which we will retain...
      Object.assign(model, {...initialState, metaModel: model.metaModel}); 
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
