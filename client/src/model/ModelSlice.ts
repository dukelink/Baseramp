/*
    Baseramp - A database for end users, enabling personal and private data ownership,
    built as a Progressive Web Application (PWA) using
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
import { buildDerived, loadData } from './ModelDerived';
import { Model, Records, RecordOfAnyType, AuditUpdate } from './ModelTypes';
import { INavigateState } from '../features/SystemNavigator/NavigateSlice';
import { SettingsState } from '../features/SettingsPage/SettingsSlice';

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
  name: 'common', // critical if reducer logic is shared in other slices!
  initialState,
  reducers: {
    metaload(model, action:PayloadAction<Records<any>>) {
      Object.assign(model.metaModel,action.payload);
    },
    load(model, action:PayloadAction<Records<any>>) { 
      loadData(model,action.payload);
    },
    refreshRecordInVM(
      model : Model, 
      action: PayloadAction<{
        navigate: INavigateState,
        settings: SettingsState,
        record: RecordOfAnyType}> ) 
    {
      const { navigate, settings, record } = action.payload;
      const { navTable, navTableID } = navigate;
      Object.assign(model.apiModel[navTable][navTableID], record); 
      buildDerived(model);
      model.outline = buildOutline(model.derivedModel,settings);
    },
    refreshVMfromAuditRecords(
        model : Model, 
        action:PayloadAction<{settings:SettingsState,audit_updates:AuditUpdate[]}>) 
    {
      const { settings, audit_updates } = action.payload;

      console.log(`refreshVMfromAuditRecords(${JSON.stringify(audit_updates)})`) 

      audit_updates.forEach((update)=>{
        const { table_name, table_id, update_type, field_changes } = update;
        const tableID = table_id.toString(); // Number not allowed as object 'index' key
        const record = JSON.parse(field_changes);
        if (['INSERT','UPDATE'].includes(update_type)) 
        {
          const tableToUpdate = model.apiModel[table_name];
          if (tableToUpdate) // Only update tables loaded
          {
            // Update model...
            const recordRef = model.apiModel[table_name][tableID];
            if (!recordRef) // INSERT case (should we assert this on update_type?)
              model.apiModel[table_name][tableID] = record;
            else {          // UPDATE case
              //const newRec : RecordOfAnyType = 
              Object.assign(recordRef, record);  //  Important: this is the operative code for audit updates
              /* REVIEW...
              // Meta data UPDATES only at this time (no INSERT/DELETEs)...
              if (table_name==='AppTable') 
                Object.assign(model.metaModel.AppTable[tableID], newRec);
              else if (table_name==='AppColumn')
                Object.assign(model.metaModel.AppColumn[tableID], newRec);
              */
            }
          }
        } 
        else if (update_type==='DELETE') {
          let tableToRemoveFrom = model.apiModel?.[table_name];
          if (tableToRemoveFrom && tableToRemoveFrom[tableID])
            delete tableToRemoveFrom[tableID]; 
        }
      })
      buildDerived(model);
      model.outline = buildOutline(model.derivedModel, settings); // should we make navigate optional and save w/in derived structures?
    },
    addRecordToVM(model, action : 
        PayloadAction<{
          navigate:INavigateState,
          settings:SettingsState,
          record:RecordOfAnyType
        }>) 
      { 
      const { navigate, settings, record } = action.payload;
      const { navTable } = navigate;
      const navTableID = record[navTable+'_id'];
      model.apiModel[navTable][navTableID] = record;
      buildDerived(model);
      model.outline = buildOutline(model.derivedModel, settings);
    }, 
    deleteRecordFromVM(model, 
      action : PayloadAction<{navigate:INavigateState,settings:SettingsState}>) 
    {
      const { navTable, navTableID } = action.payload.navigate;
      // NOTE: 'delete' results in 'sparse' array, 
      //       which has proven to be OK for now...
      delete model.apiModel[navTable][navTableID]; 
      buildDerived(model);
      model.outline = buildOutline(model.derivedModel, action.payload.settings);
    },
    // NOTE: Do not export the following as it is merely a side-effect
    //       of the 'primary' action method in SettingsSlice...
    setOutlineFilters(model, action: PayloadAction<{settings:SettingsState}>) {
      model.outline = buildOutline(model.derivedModel, action.payload.settings);
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
  refreshVMfromAuditRecords,
  addRecordToVM, 
  deleteRecordFromVM, 
  clearModelReducer
} = model.actions;

export default model.reducer; 
