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
import { buildOutline } from './ModelOutline';
import { testModelData } from './testModel';
import { buildDerived, loadData } from './ModelDerived';
import { Model, Records, RecordOfAnyType, AuditUpdate } from './ModelTypes';
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
        action:PayloadAction<{navigate:INavigateState,record:RecordOfAnyType}>) 
    {
      const { navigate, record } = action.payload;
      const { navTable, navTableID } = navigate;
      Object.assign(model.apiModel[navTable][navTableID], record); 
      buildDerived(model);
      /*
      switch (navTable) {
        case 'AppTable' :
          Object.assign(model.metaModel.AppTable[navTableID], record);
          break;
        case 'AppColumn' :
          Object.assign(model.metaModel.AppColumn[navTableID], record);
          break;
      } 
      */
      model.outline = buildOutline(model.derivedModel,navigate);
    },
    refresVMfromAuditRecords(
        model : Model, 
        action:PayloadAction<{navigate:INavigateState,audit_updates:AuditUpdate[]}>) 
    {
      const { navigate, audit_updates } = action.payload;

      //console.log(`refreshVMfromAuditRecords(${JSON.stringify(audit_updates)})`)

      audit_updates.forEach((update)=>{
        const { table_name, table_id, update_type, field_changes } = update;
        const tableID = table_id.toString(); // Number not allowed as object 'index' key
        const record = JSON.parse(field_changes);
        if (['INSERT','UPDATE'].includes(update_type)) 
        {
          // Update model...
          const recordRef = model.apiModel[table_name][tableID];
          if (!recordRef) // INSERT case (should we assert this on update_type?)
            model.apiModel[table_name][tableID] = record;
          else {          // UPDATE case
            //const newRec : RecordOfAnyType = Object.assign(recordRef, record);  
            /*
            // Meta data UPDATES only at this time (no INSERT/DELETEs)...
            if (table_name==='AppTable') 
              Object.assign(model.metaModel.AppTable[tableID], newRec);
            else if (table_name==='AppColumn')
              Object.assign(model.metaModel.AppColumn[tableID], newRec);
            */
          }
        } 
        else if (update_type==='DELETE')
          delete model.apiModel[table_name][tableID]; 
      })
      buildDerived(model);
      model.outline = buildOutline(model.derivedModel, navigate);
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
      // REVIEW: 'delete' results in 'sparse' array...
      // I assume this is faster and OK???
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
  refresVMfromAuditRecords,
  addRecordToVM, 
  deleteRecordFromVM, 
  setActiveItemDisplay, 
  setTestDataModeReducer,
  clearModelReducer
} = model.actions;

export default model.reducer; 
