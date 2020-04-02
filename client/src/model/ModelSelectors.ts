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

import { RootState } from '../rootReducer';
import { useSelector } from 'react-redux';
import { RecordOfAnyType, Records } from './ModelTypes';

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
      referenceTable = Object.values(state.model.apiModel[referenceTableName])
        .filter((rec:RecordOfAnyType) => (
          // Don't filter out any foreign keys if Active record only filter is OFF...
          !state.navigate.navActiveFilter ||
          // Otherwise, filter out any foreign keys that ARE in the inactive list...
          !state.model.inactive_status_ids
            .includes(rec[referenceTableName+'_status_id'] || '*no-match*') ||
          // Except DO NOT filter out the foreign key currently being referenced...
          rec[referenceTableName+'_id']
            === state.model.apiModel[state.navigate.navTable][state.navigate.navTableID]
            [fieldName.replace(state.navigate.navParentTable+'_',referenceTableName+'_')]
        ));
  }
  return { appCol, referenceTableName, referenceTable }; 
}
