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
import { outlineNode, buildOutline } from './SystemOutline';
import { RootState } from '../rootReducer';

export interface NavigateState {
  navTable: string;
  navTableID: string;
  navParentTable: string;
  navStrParentID: string;
  navActiveFilter : boolean;
  navOutline: outlineNode[];
  testDataMode: boolean;
};

export interface RecordOfAnyType { [key:string]:any; }
export interface Records<T> { [key:string]:T; }
export interface ViewModelState { [key:string]:Records<any>; }
export interface RecordDerived {
  closedItem: boolean,
  inProgress: boolean
}
export interface ViewModelDerived  { [key:string]:Records<RecordDerived>; } 

export interface IAppTableRow {
  AppTable_id: string;
  AppTable_title: string;
  AppTable_description?: string;
  AppTable_rank?: number;
  AppTable_table_name: string;
}

export interface IAppColumnRow {
  AppColumn_id: string;
  AppColumn_title: string;
  AppColumn_description?: any;
  AppColumn_rank: number;
  AppColumn_AppTable_id: string;
  AppColumn_ui_hidden: boolean;
  AppColumn_ui_minwidth?: any;
  AppColumn_read_only: boolean;
  AppColumn_column_name: string;
  AppColumn_is_nullable: string;
  AppColumn_data_type: string;
  AppColumn_character_maximum_length?: number;
  AppColumn_column_default?: any;
  AppColumn_related_pk_id?: string;
}

export interface MetaModelState {
  AppTable : Records<IAppTableRow>, 
  AppColumn : Records<IAppColumnRow>,
  [key:string] : Records<IAppTableRow|IAppColumnRow> // just to allow ['AppTable'|'AppColumn'] syntax
}

export interface Model {
  apiModel: ViewModelState,
  derivedModel: ViewModelDerived,
  metaModel: MetaModelState,
  navigate: NavigateState
}

let initialState : Model = {
  apiModel: {},
  derivedModel: {},
  metaModel: { // TODO: temporarily duplicated from apiModel for now
    AppTable : {},
    AppColumn : {}
  },
  navigate: {
    navTable: "",
    navTableID: "",
    navParentTable: "",
    navStrParentID: "",
    navActiveFilter: true,
    navOutline: [],
    testDataMode: false
  }
};

function buildDerived(model: Model) 
// TODO: Incremental updates possible
{
  const apiModel = model.apiModel;
  let inactive_status_ids: Array<number>;
  let inprogress_status_ids: Array<number>;
  let apiDerived : ViewModelDerived = {}; 

  inactive_status_ids = Object.values(apiModel['status']).filter((row: any) => (
    (row['status_title'] === 'Completed' || row['status_title'] === 'Canceled')
  )).map((row: any) => (row['status_id']));

  inprogress_status_ids = Object.values(apiModel['status']).filter((row: any) => (
    (row['status_title'] === 'Started') 
  )).map((row: any) => (row['status_id']));

  Object.keys(apiModel).forEach(tableName=>{
    const records = apiModel[tableName];
    let recordsDerived : Records<RecordDerived> = {};
    Object.keys(records).forEach( key => {
      const stat_id = records[key][tableName + '_status_id'];
      const recordDerived : RecordDerived = {
        closedItem : (stat_id && inactive_status_ids.includes(stat_id)),
        inProgress : (stat_id && inprogress_status_ids.includes(stat_id))
      }
      recordsDerived[key] = recordDerived;
    })
    apiDerived[tableName] = recordsDerived;
  })

  model.derivedModel = apiDerived;
}

const model = createSlice({
  name: 'model',
  initialState,
  reducers: {
    load(state,action:PayloadAction<any>) { 
      Object.assign(state.apiModel,action.payload);
      state.metaModel.AppTable = state.apiModel['AppTable'];
      state.metaModel.AppColumn = state.apiModel['AppColumn']; // sync new meta slice
      buildDerived(state);
      state.navigate.navOutline = buildOutline(state,state.navigate.navActiveFilter);
    },
    refreshRecordInVM(state,action:PayloadAction<{
        navTable:string,navTableID:string,recordDelta:any}>) {
      const { navTable, navTableID, recordDelta } = action.payload;
      Object.assign(state.apiModel[navTable][navTableID], recordDelta); 
      buildDerived(state);
      if (['AppTable','AppColumn'].includes(navTable)) {// sync new meta slice
          Object.assign(state.metaModel[navTable][navTableID], recordDelta);
      }
      state.navigate.navOutline = buildOutline(state,state.navigate.navActiveFilter);
    },
    addRecordToVM(state,action:PayloadAction<{navTable:string,record:any}>) {
      const { navTable, record } = action.payload;
      state.navigate.navTableID = record[navTable+'_id'];
      state.apiModel[navTable][state.navigate.navTableID] = record;
      buildDerived(state);
      state.navigate.navOutline = buildOutline(state,state.navigate.navActiveFilter);
    }, 
    deleteRecordFromVM(state,action:PayloadAction<{navTable:string,navTableID:string}>) {
      const { navTable, navTableID } = action.payload;
      delete state.apiModel[navTable][navTableID];
      buildDerived(state);
      state.navigate.navOutline = buildOutline(state,state.navigate.navActiveFilter);
      state.navigate.navTableID = '';
    },
    setFocus(state, action: PayloadAction<Pick<outlineNode,'table'|'tableID'|'parentTable'|'parentID'>>) {
      const { table, tableID, parentTable, parentID } = action.payload;
      state.navigate.navTable = table||"";
      state.navigate.navTableID = (tableID||"").toString();
      state.navigate.navParentTable = (parentTable||"");
      state.navigate.navStrParentID = (parentID||"").toString();
    },
    addNewBlankRecordForm(state,action:PayloadAction<{navTable:string}>) {
      const { navTable } = action.payload;
      state.navigate.navTableID = '-1';
      console.log('ADD NEW BLANK RECORD')
    },
    setActiveItemDisplay(state,action:PayloadAction<{navActiveFilter:boolean}>) {
      state.navigate.navActiveFilter = action.payload.navActiveFilter;
      state.navigate.navOutline = buildOutline(state,state.navigate.navActiveFilter);
    },
    setTestDataModeReducer(state,action:PayloadAction<{testDataMode:boolean}>) {
      state.navigate.testDataMode = action.payload.testDataMode; 
    },
    clearModeReducer(state) {
      Object.assign(state, initialState); 
    }
  }
});

export const selectTableAppCols = (state:RootState,navTable:string) => {
  return Object.values(state.model.metaModel.AppColumn) 
      .filter( row => row.AppColumn_AppTable_id===navTable );       
}

export const selectFieldMetadata = (state:RootState,fieldName:string) => {
  const appCol = state.model.metaModel.AppColumn[fieldName];
  const _related_pk_id = appCol.AppColumn_related_pk_id;

  //
  // TODO: split out reference table stuff into another function
  //
  let referenceTableName : string = '';
  let referenceTable:Records<any> = []; 
  if (_related_pk_id) {
      referenceTableName = state.model.metaModel.AppTable
        [state.model.metaModel.AppColumn[_related_pk_id].AppColumn_AppTable_id]
          .AppTable_table_name;
      referenceTable = Object.values(state.model.apiModel[referenceTableName]);
  }

  return { appCol, referenceTableName, referenceTable }; 
}

export const { 
  load, 
  refreshRecordInVM, 
  addNewBlankRecordForm, 
  addRecordToVM, 
  deleteRecordFromVM, 
  setActiveItemDisplay, 
  setTestDataModeReducer,
  clearModeReducer,
  setFocus
} = model.actions;

export default model.reducer; 
