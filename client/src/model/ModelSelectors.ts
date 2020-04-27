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

import { RootState } from '../rootReducer';
import { ViewModelDerived } from '../model/ModelTypes';
import { useSelector } from 'react-redux';
import { RecordOfAnyType, Records } from './ModelTypes';

export const useRecord = (
    navTable:string, navTableID='-1', 
    navParentTable?:string, navStrParentID ?: string
) => {
  const columnMetadata = useTableAppCols(navTable);
  const derivedModel 
    = useSelector<RootState,ViewModelDerived>(state=>state.model.derivedModel);

  let record : RecordOfAnyType;

  if (navTableID && navTableID!=='-1')
    // Return row from VM...
    // NOTE: Optional chaining & default is only needed now that
    // we have implement real-time, multi-user, polled updates,
    // where the 'model' might be updated asynchronously prior
    // to recomputing the derived model.  Perhaps we are entering
    // into use-cases where we'll need more sophisticated async
    // handling, but this was the only 'fix' found to be needed
    // so far...
    record = derivedModel[navTable][navTableID]?.record || {};
  else {  
    // Initialize new row...
    record = {};
    // Mutating 'record' to accumulate initial values will be faster than
    // successively replacing values ("immutably") using reduce...
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

    // Default foreign key from parent table in outline
    // TODO: Need something more sophisticated as there may be multiple FKs
    // available in the heirarchy...
    if (navParentTable && navStrParentID) 
      record[navTable + '_' + navParentTable + '_id'] = navStrParentID;
  }

  return record;
}

export const useTableAppCols = (navTable:string) => {
  const state = useSelector<RootState,RootState>(state=>state);
  let cols = Object.values(state.model.metaModel.AppColumn) 
      .filter( row => row.AppColumn_AppTable_id===navTable )
      .sort( (firstCol,secondCol) => 
        (firstCol.AppColumn_rank - secondCol.AppColumn_rank) );
  return cols;
}

export const useFieldMetadata = (fieldName:string) => {
  const state = useSelector<RootState,RootState>(state=>state);
  const { navTable, navTableID, navParentTable, navActiveFilter } = state.navigate; 
  const appCol = state.model.metaModel.AppColumn[fieldName];
  const _related_pk_id = appCol.AppColumn_related_pk_id;
  let referenceTableName : string = '';
  let referenceTable:Records<any> = []; 
  if (_related_pk_id) {
    referenceTableName = state.model.metaModel.AppTable
      [state.model.metaModel.AppColumn[_related_pk_id].AppColumn_AppTable_id]
        .AppTable_table_name;
    // TODO: '?.' only needed pre-login when 'role' not found for new user setup...
    referenceTable = Object.values(state.model?.apiModel[referenceTableName])
      .filter((rec:RecordOfAnyType) => (
        // Don't filter out any foreign keys if Active record only filter is OFF...
        !navActiveFilter ||
        // Otherwise, filter out any foreign keys that ARE in the inactive list...
        !state.model.inactive_status_ids
          .includes(rec[referenceTableName+'_status_id'] || '*no-match*') ||
        // Except DO NOT filter out the foreign key currently being referenced...
        ((navTableID && navTableID!=='-1') &&
          rec[referenceTableName+'_id']
            === state.model?.apiModel[navTable][navTableID]
            [fieldName.replace(navParentTable+'_',referenceTableName+'_')])
      ))
      // If reference table is AppTable then
      // scope tables presented to only those with 
      // a foreign key to the current navTable...
      .filter((rec:RecordOfAnyType)=>(
        referenceTableName !== 'AppTable'
          ||  state.model.metaModel.AppColumn[
                rec[referenceTableName+'_title']+'_'+navTable+'_id'
              ] !== undefined)
      )
      // If many-to-many, cyclic foreign key, then filter out current record
      .filter((rec:RecordOfAnyType)=>(
        navTable!==referenceTableName 
        || navTableID !== rec[referenceTableName+'_id']?.toString()
      ));
  }
  return { appCol, referenceTableName, referenceTable }; 
}
