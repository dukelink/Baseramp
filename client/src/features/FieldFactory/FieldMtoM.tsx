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

import React, { memo } from 'react';
import { AppColumnRow } from '../../model/ModelTypes';
import { FormControl, Select, MenuItem, InputLabel, 
     Checkbox, ListItemText, Chip } 
  from '@material-ui/core';
import { useStyles } from './FieldStyles';
import { Records } from '../../model/ModelTypes';

export const FieldMtoM = memo((props : {
    appCol: AppColumnRow, 
    fieldName: string, 
    field: any,
    referenceTableName: string, 
    referenceTable: Records<any>,
    onChange:(fieldName:string,newVal:any)=>(void)
}) => {
  const { appCol, fieldName, onChange, 
      referenceTableName, referenceTable } = props;
  const { AppColumn_title : appColTitle, AppColumn_ui_minwidth,
      AppColumn_read_only, AppColumn_is_nullable } = appCol;
  const classes = useStyles();     

  // Allow mutating and tracking current value to prevent number field rerendering
  // (see onChange in character varying data type TextField control)
  let { field } = props; 
  
  const flagEmptyRequiredField = AppColumn_is_nullable==="NO" && !field;

  if (!field) field = [];
  
  return (
    <FormControl 
    error={ flagEmptyRequiredField }
    style = {{ 
      width: ( AppColumn_ui_minwidth || "198px")
    }} >
      <InputLabel 
        id = {"label"+fieldName} 
        className = { classes.fkDefaultLable } >
        { appColTitle } 
      </InputLabel>
      <Select
        className={ classes.formControl }
        multiple
        variant="outlined"
        error={ flagEmptyRequiredField }
        label = { appColTitle }
        disabled = { AppColumn_read_only }
        value={ field }

        renderValue={(x) => {
          const selected = x as any;
          return (
            <div className={classes.chips}>
            {selected.map((value:any) => { 
              const refRow = referenceTable
                .filter( (row:any) => 
                  row[referenceTableName+'_id']===value)[0];
              return (
                <Chip key={ value } 
                  label={ refRow[referenceTableName+'_title'] } 
                  className={classes.chip} />
              )}
            )}
            </div>
          )
        }}

        onChange = { (e : any) => onChange(fieldName,e.target.value) }>            
        { 
        referenceTable.map((row:any) => (
          <MenuItem key = { row[referenceTableName+'_id'] } 
                value = { row[referenceTableName+'_id'] }>
            <Checkbox checked={field.indexOf(row[referenceTableName+'_id']) > -1} />
            <ListItemText primary={ row[referenceTableName+'_title'] } />
          </MenuItem>))
        } 
      </Select>
    </FormControl>
  );
}); 
