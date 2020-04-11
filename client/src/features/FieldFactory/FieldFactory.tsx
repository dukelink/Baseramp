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

import React, { ChangeEvent } from 'react';

import { FormControl, Select, Switch, MenuItem, InputLabel } 
  from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers'; 
import { FieldText } from './FieldText';
import { useStyles } from './FieldStyles';

import { useFieldMetadata } from '../../model/ModelSelectors';

// NOTE: memoization does not help since the onChange callback 
// currently changes on every field-level state change...
export const AppField =  ( props : { 
    fieldName:any,
    field:any,
    onChange: (fieldName:string, newVal:any)=>(void)
}) => 
{
  const { fieldName, field, onChange } = props;
  const classes = useStyles();
  const { appCol, referenceTableName, referenceTable } = useFieldMetadata(fieldName);
  const { AppColumn_title : appColTitle, 
          AppColumn_data_type, AppColumn_ui_minwidth,
          AppColumn_is_nullable, AppColumn_read_only } = appCol;

  const flagEmptyRequiredField = AppColumn_is_nullable==="NO" && !field;

  console.log(`AppField(): fieldName=${fieldName}`);

  function onSwitchChange(e:ChangeEvent<HTMLInputElement>) {
    onChange(fieldName,e.target.checked);
  }

  function onDatepickerChange(dt:any, val:string|null|undefined) {
    onChange(fieldName,val);
  }

  if (referenceTableName) {
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
          variant="outlined"
          error={ flagEmptyRequiredField }
          label = { appColTitle }
          disabled = { AppColumn_read_only }
          value={ field || '' }
          onChange = { (e : any) => onChange(fieldName,e.target.value) }>            
          <MenuItem> 
            {
              // TODO: Make conditional to allow nullification only of nullable fields; 
              //       also review styling of the 'blank' entry.
              "(Clear entry)"
            }
          </MenuItem>
          { 
            referenceTable.map((row:any) => (
              <MenuItem 
                  key = { row[referenceTableName+'_id'] } 
                  value = { row[referenceTableName+'_id'] }>
                { row[referenceTableName+'_title'] }
              </MenuItem>))
          }
        </Select>
      </FormControl>
    );
  }
  else 
  {
    let rv : JSX.Element;

    switch(AppColumn_data_type) 
    {
      case 'bit': // TODO: Test w/ Postgresql, might be 'boolean'....
        rv = (
        <div style = {{ 
              width: ( AppColumn_ui_minwidth || "198px")
            }} 
            className={classes.nowrap}>
          <InputLabel id = {"label"+fieldName}> 
            <Switch
              checked={field || false} 
              onChange = { onSwitchChange }       
              color="primary" />
            { appColTitle }
          </InputLabel>
        </div>)

        break;

      case 'integer' :
        // Yes, fall through to 'character varying' code...
      case 'character varying' :
        rv = (
          <FieldText appCol = { appCol }
            fieldName = { fieldName }
            field = { field }
            onChange = { onChange }
          />
        );
        break; 

      case 'date' :
        // Note: KeyboardDatePicker should NOT be wrapped in FormControl (caused misalginment) 
        rv = (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker 
              className={classes.formControl} 
              style = {{ 
                width: ( AppColumn_ui_minwidth || "150px")
              }}
              disableToolbar
              variant="inline"
              error={ flagEmptyRequiredField }
              format="MM/dd/yyyy"
              margin="normal"
              label = { appColTitle }
              value = { field || null /* null works well for date fields */ }
              disabled = { AppColumn_read_only }
              onChange = { onDatepickerChange }     
              inputVariant = 'outlined'
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}/>
          </MuiPickersUtilsProvider>
        );
        break;

      default :
        rv = <div>!!CONTROL NOT FOUND FOR DATA TYPE: { AppColumn_data_type }!!</div>
    }

    return rv; 
  }
}

