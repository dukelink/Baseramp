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
  useState, useEffect, useLayoutEffect, useRef, Dispatch, SetStateAction 
} from 'react';
import { RecordOfAnyType, AppColumnRow } from '../../model/ModelTypes';
import { useTableAppCols } from '../../model/ModelSelectors';
import { usePrevious } from '../../utils/utils';
import { AppField } from '../FieldFactory/FieldFactory';  

export class NodeFormEditState {
  constructor(isFormValidDefault?:boolean) {
    this.isFormValid = isFormValidDefault || false; // conservative default assumption
  }
  record : RecordOfAnyType = {};
  isFormValid : boolean;
  originalRecord : RecordOfAnyType = {};
}

export type NodeFormEditState_OnChange 
  = (stateRecord:NodeFormEditState) => (void);

export interface NodeFormProps {
  navTable   : string, 
  navTableID : string, 
  record     : RecordOfAnyType,
  dispatch   : Dispatch<SetStateAction<NodeFormEditState>>
}

export const NodeForm =  
(props : NodeFormProps) => {
  const { navTable, navTableID, record, dispatch } = props;
//  const dispatch = useContext(NodeFormDispatch);
  const priorRecord = usePrevious(record);
  let tableAppCols = useTableAppCols(navTable); 
  const [ state, setState ] = useState<RecordOfAnyType>(); 
  const firstFieldRef = useRef<HTMLSpanElement>();
  const dummyRef = useRef<HTMLSpanElement>();

  // Initialize state to the 'record' property
  // HACK: This seems like a hack compared to the straightforward
  //       props to state mapping (and built-in "memoization")
  //       of PureComponent, or making this a controlled/redux-connected
  //       component, but perhaps it is a small price to pay to for standardizing 
  //       on all Function Components, which allows me to compose behaviors with
  //       hooks at any time.
  useEffect(() => { 
    setState(record); 
    dispatch({ record, isFormValid: false, originalRecord : record });
  }, [record,props,dispatch]); 

  useLayoutEffect(() => {
    if (navTableID==='-1' && firstFieldRef.current) {
      // Focus on first form field after Add New...
      firstFieldRef.current.getElementsByTagName('input')[0]?.focus();
    } 
  }, [record,navTableID,priorRecord])

  console.log(`<NodeForm navTable=${navTable} navTableID=${navTableID} record=${JSON.stringify(record)} />`);

  if  // Just return a blank fragment if state is empty or is in the process of changing...
      ( !state || ( 
            ( !Object.keys(state).length
              // Test needed & related to hack above; TODO: Explain fully
              || priorRecord !== record )
        // But -1 is key for a new record, so continue to render the blank form below
        && navTableID!=='-1' ) )
    return <></>;
  else {
    return (
    <div style={{ paddingRight: 16 }}>
      {
        tableAppCols
          .filter((appCol:AppColumnRow) => !appCol.AppColumn_ui_hidden)
          .map((appCol:any, index:number) => {
            const fieldName = appCol.AppColumn_column_name;
            return (
              <span  
                  id = { 'AppField_'+fieldName } // useful reference for unit tests
                  key = { fieldName } 
                  ref ={ (index===0 ? firstFieldRef : dummyRef) as any } > 
                <AppField                      
                  fieldName = { fieldName } 
                  field     = { state[fieldName]} 
                  onChange  = { onChange } /> 
              </span> )
        })
      }
    </div>
  )}

  function onChange(fieldName: string, newVal: RecordOfAnyType)
  {
    const newState : RecordOfAnyType = {...state, [fieldName]: newVal };

    setState(newState);

    const uncompletedRequiredFields 
      // Form considered complete (and correct for now) if there are no unfilled required fields...
      = tableAppCols.filter( (col) => (
        col.AppColumn_is_nullable==="NO"                  // A required field
        && !col.AppColumn_ui_hidden                       // That is in the UI and able to be completed
        && !newState[col.AppColumn_column_name]           // And that is empty at the moment!
        && (col.AppColumn_data_type!=='bit' ||            // bit fields cannot be considered empty if falsy
            typeof newState[col.AppColumn_column_name]
              !== 'boolean') 
        ) );

//    console.log(`uncompletedRequiredFields = ${JSON.stringify(uncompletedRequiredFields)}`)
    dispatch({ 
      record: newState, 
      isFormValid: !uncompletedRequiredFields.length,
      originalRecord : record
    });

  }
};
