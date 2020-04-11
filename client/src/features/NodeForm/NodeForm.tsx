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

import React, { 
  useState, useEffect, useLayoutEffect, useRef, Dispatch, SetStateAction, memo 
} from 'react';
import { RecordOfAnyType, AppColumnRow } from '../../model/ModelTypes';
import { useTableAppCols } from '../../model/ModelSelectors';
import { AppField } from '../FieldFactory/FieldFactory';  

export class NodeFormEditState {
  public originalRecord : RecordOfAnyType = this.record;
  constructor(
    public isFormValid = false, 
    public record : RecordOfAnyType = {}
  ) { }
}

export interface NodeFormProps {
  navTable   : string, 
  navTableID : string
  record     : RecordOfAnyType,
  dispatch   : Dispatch<SetStateAction<NodeFormEditState>>
}

export const NodeForm =  memo(
(props : NodeFormProps) => {
  const { navTable, navTableID, record, dispatch } = props;
  let tableAppCols = useTableAppCols(navTable); 
  const [ state, setState ] = useState<RecordOfAnyType>(record); 
  const formRef = useRef<any>();

  // Initialize state to the 'record' property... (this is the standard 
  // way to populate initial state in a functional component)
  useEffect(() => { 
    console.log('NodeForm initial setState....')
    setState(record); 
  }, [record,props,dispatch]); // REVIEW

  // Focus on first form field after Add New...
  useLayoutEffect(() => {
    if (navTableID==='-1')
      formRef.current.getElementsByTagName('input')[0]?.focus();
  },[navTableID]);

  console.log(`<NodeForm navTable=${navTable} navTableID=${navTableID} />`);

  return (
    <div ref={formRef} style={{ paddingRight: 16 }}>
    { // Make sure there is a form to render...
      (!state || (navTableID!=='-1' && !Object.keys(state).length)) ||
      tableAppCols
        .filter((appCol:AppColumnRow) => !appCol.AppColumn_ui_hidden)
        .map((appCol:any, index:number) => {
          const fieldName = appCol.AppColumn_column_name;
          return (
            <span  
                id = { 'AppField_'+fieldName } // useful for unit tests
                key = { fieldName } > 
              <AppField                      
                fieldName = { fieldName } 
                field     = { state[fieldName]} 
                onChange  = { onChange } /> 
            </span> )
      })
    }
    </div>
  )

  function onChange(fieldName: string, newVal: RecordOfAnyType)
  {
    // Keep local form data state up-to-date...
    const newState : RecordOfAnyType = {...state, [fieldName]: newVal };
    setState(newState);


console.log(`CHANGE FIELD fieldName=${fieldName}, newVal=${JSON.stringify(newVal)}`);

    // Also update record (and form-valid flag) at form container level
    // which is responsible for CRUD controls etc...
    const uncompletedRequiredFields 
      // Form considered complete (and correct for now) if there are no unfilled required fields...
      = tableAppCols.filter( (col) => (
        col.AppColumn_is_nullable==="NO"        // A required field
        && !col.AppColumn_ui_hidden             // That is in the UI and able to be completed
        && !newState[col.AppColumn_column_name] // And that is empty at the moment!
        && (col.AppColumn_data_type!=='bit' ||  // bit fields cannot be considered empty if falsy
            typeof newState[col.AppColumn_column_name]
              !== 'boolean') 
        ) );
    dispatch({ 
      record: newState, 
      isFormValid: !uncompletedRequiredFields.length,
      originalRecord : record
    });
  }
});
