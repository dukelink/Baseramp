/*
    Baseramp - A database for end users enabling personal and private data ownership,
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

import React, { 
  useState, useEffect, useLayoutEffect, useRef, Dispatch, SetStateAction, memo 
} from 'react';
import { RecordOfAnyType, AppColumnRow } from '../../model/ModelTypes';
import { useTableAppCols } from '../../model/ModelSelectors';
import { AppField } from '../FieldFactory/FieldFactory';  

export class NodeFormEditState {
  constructor(
    public isFormValid = false, 
    public record : RecordOfAnyType = {}
  ) { }
}

export interface NodeFormProps {
  navTable   : string, 
  navTableID : string,
  activeFilter ?: boolean,
  record     : RecordOfAnyType,
  dispatch   : Dispatch<SetStateAction<NodeFormEditState>>
}

type OnChange = (fieldName: string, newVal: RecordOfAnyType) => (void)

const InnerRender = memo(
  (props: {
    state:RecordOfAnyType,
    navTable:string,
    navTableID:string,
    activeFilter?:boolean,
    tableAppCols:AppColumnRow[],
    onChange:OnChange
  }) => {
  const {state,navTable,navTableID,activeFilter,tableAppCols,onChange} = props;    
  const empty = (
    !state[navTable+"_id"] 
    || ((state[navTable+"_id"]||'').toString() !== navTableID))
    && navTable!=='user' && navTableID!=="-1"; // REVIEW: render new user signup form
  return( empty ? <></> : <>
  { // Make sure there is a form to render...
    (!state || (navTableID!=='-1' && !Object.keys(state).length)) ||
    tableAppCols
      .filter((appCol:AppColumnRow) => !appCol.AppColumn_ui_hidden)
      .map((appCol:any) => {
        const fieldName = appCol.AppColumn_column_name;
        return (
          <span  
              id = { 'AppField_'+fieldName } // useful for unit tests
              key = { fieldName } > 
            <AppField                      
              fieldName = { fieldName } 
              field     = { state[fieldName]} 
              navTable  = { navTable }
              navTableID= { navTableID }
              activeFilter = { activeFilter }
              appCol    = { appCol }
              onChange  = { onChange } /> 
          </span> )
    })
  }</>
)}, (prev,next)=>{
//  console.log(prev);
//  console.log(next);
  const rv = ( 
    (next.state[next.navTable+"_id"]||'').toString() !== next.navTableID
    //&& JSON.stringify(prev.state) === JSON.stringify(next.state)
    && prev.state === next.state
    //&& prev.navTableID !== "-1"
  )
  if (rv)
    console.log(`*****SUPPRESS NodeForm RERENDER********`)
  return rv;
})

export const NodeForm = 
(props : NodeFormProps) => {
  const { navTable, navTableID, activeFilter, record, dispatch } = props;
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
    <div ref={formRef}>
      <InnerRender 
        state={state} 
        navTable={navTable} 
        navTableID={navTableID} 
        activeFilter={activeFilter}
        tableAppCols={tableAppCols}
        onChange={onChange} />
    </div>
  )

  function onChange(fieldName: string, newVal: RecordOfAnyType)
  {
    // Keep local form data state up-to-date...
    const newState : RecordOfAnyType = {...state, [fieldName]: newVal };
    setState(newState);

//console.log(`CHANGE FIELD fieldName=${fieldName}, newVal=${JSON.stringify(newVal)}`);

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
      isFormValid: !uncompletedRequiredFields.length
    });
  }
};
