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
import { OutlineNode, buildOutline } from './SystemOutline';
import { RootState } from '../rootReducer';
import { testModelData } from '../model/testModel';
import { useSelector } from 'react-redux';

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
  AppColumn_description?: string;
  AppColumn_rank: number;
  AppColumn_AppTable_id: string;
  AppColumn_ui_hidden: boolean;
  AppColumn_ui_minwidth?: number;
  AppColumn_read_only: boolean;
  AppColumn_column_name: string;
  AppColumn_is_nullable: string;
  AppColumn_data_type: 'bit' | 'character varying' | 'date' | 'datetimeoffset' | 'integer' | 'text';
  AppColumn_character_maximum_length?: number;
  AppColumn_column_default?: any;
  AppColumn_related_pk_id?: string;
}

export interface IMetaModelState {
  AppTable : Records<IAppTableRow>, 
  AppColumn : Records<IAppColumnRow>,
  // And just to allow ['AppTable'|'AppColumn'] syntax, we'll add...
  // (Only used around line # 165, below, may deprecate this access later...)
  [key:string] : Records<IAppTableRow|IAppColumnRow> 
}

export interface Model {
  apiModel: ViewModelState,
  derivedModel: ViewModelDerived,
  metaModel: IMetaModelState,
  outline: OutlineNode[]
}

let initialState : Model = {
  apiModel: {},
  derivedModel: {},
  metaModel: { // TODO: temporarily duplicated from apiModel for now
    AppTable : {},
    AppColumn : {}
  },
  outline: []
};

function buildDerived(model: Model) 
// TODO: Incremental updates possible
{
  const apiModel = model.apiModel;
  let inactive_status_ids: Array<number>;
  let inprogress_status_ids: Array<number>;
  let apiDerived : ViewModelDerived = {}; 

  inactive_status_ids = Object.values(apiModel['status']).filter((row: RecordOfAnyType) => (
    (row['status_title'] === 'Completed' || row['status_title'] === 'Canceled')
  )).map((row: RecordOfAnyType) => (row['status_id']));

  inprogress_status_ids = Object.values(apiModel['status']).filter((row: RecordOfAnyType) => (
    (row['status_title'] === 'Started') 
  )).map((row: RecordOfAnyType) => (row['status_id']));

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

function loadData(state:Model,data:Records<any>)
{
  Object.assign(state.apiModel,data);
  // Sync meta data if loaded as part of post-login 'all' route,
  // otherwise do not clear existing metadata...
  if (Object.keys(state.apiModel.AppTable)) {
    state.metaModel.AppTable = state.apiModel.AppTable;
    state.metaModel.AppColumn = state.apiModel.AppColumn;
  }
  buildDerived(state);
  state.outline = buildOutline(state,true/*we always load with filter on for now*/); 
}

const model = createSlice({
  name: 'model',
  initialState,
  reducers: {
    metaload(state,action:PayloadAction<Records<any>>) {
      Object.assign(state.metaModel,action.payload);
    },
    load(state,action:PayloadAction<Records<any>>) { 
      loadData(state,action.payload);
    },
    refreshRecordInVM(state,action:PayloadAction<{
        navTable:string,navTableID:string,navActiveFilter:boolean,recordDelta:RecordOfAnyType}>) {
      const { navTable, navTableID, navActiveFilter, recordDelta } = action.payload;
      Object.assign(state.apiModel[navTable][navTableID], recordDelta); 
      buildDerived(state);
      if (['AppTable','AppColumn'].includes(navTable)) {// sync new meta slice
          Object.assign(state.metaModel[navTable][navTableID], recordDelta);
      }
      state.outline = buildOutline(state,navActiveFilter);
    },
    addRecordToVM(state,action:PayloadAction<{navTable:string,navActiveFilter:boolean,record:RecordOfAnyType}>) {
      const { navTable, navActiveFilter, record } = action.payload;
      const navTableID = record[navTable+'_id'];
      state.apiModel[navTable][navTableID] = record;
      buildDerived(state);
      state.outline = buildOutline(state,navActiveFilter);
    }, 
    deleteRecordFromVM(state,action:PayloadAction<{navTable:string,navTableID:string,navActiveFilter:boolean}>) {
      const { navTable, navTableID, navActiveFilter } = action.payload;
      delete state.apiModel[navTable][navTableID];
      buildDerived(state);
      state.outline = buildOutline(state,navActiveFilter);
    },
    setActiveItemDisplay(state,action:PayloadAction<{navActiveFilter:boolean}>) {
      state.outline = buildOutline(state,action.payload.navActiveFilter);
    },
    setTestDataModeReducer(state,action:PayloadAction<{testDataMode:boolean}>) {
      if (action.payload.testDataMode)
        loadData(state,testModelData.apiModel); 
    },
    clearModelReducer(state) {
      // Reset everything to initial state, except for meta data which we will retain...
      Object.assign(state, {...initialState, metaModel: state.metaModel}); 
    }
  }
});

export const useInitializedRecord = (navTable:string) => {
  const columnMetadata = useTableAppCols(navTable);
  // Mutating 'record' to accumulate initial values will be faster than
  // successively replacing values ("immutably") using reduce... 
  let record : RecordOfAnyType = {};
  columnMetadata.forEach( col => {
    // Since NodeForms use a two state switch control
    // for boolean values, we cannot visibly represent 
    // undefined or null so users would be unable to, e.g., 
    // see or have an easy way to enter 'false' for a required
    // boolean field since it would already display as off/false.
    // NOTE: More rules will probably be added here in the future,
    // including perhaps querying initial values from SQL if
    // database level defaults have been defined...
    if (col.AppColumn_data_type==='bit')
      record[col.AppColumn_column_name] = false;
  });
  return record;
}

export const useTableAppCols = (navTable:string) => {
  const state = useSelector<RootState,RootState>(state=>state);
  return Object.values(state.model.metaModel.AppColumn) 
      .filter( row => row.AppColumn_AppTable_id===navTable );       
}

export const useFieldMetadata = (fieldName:string) => {
  const state = useSelector<RootState,RootState>(state=>state);
  const appCol = state.model.metaModel.AppColumn[fieldName];
  const _related_pk_id = appCol.AppColumn_related_pk_id;
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
