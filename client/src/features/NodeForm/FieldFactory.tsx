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

import React from 'react';

import { FormControl, TextField, Select, Switch, MenuItem, InputLabel, makeStyles } 
  from '@material-ui/core';
import NumberFormat from 'react-number-format';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers'; 

import { useFieldMetadata } from '../../model/ModelSelectors';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  nowrap: {
    display: 'inline-flex',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    paddingTop: '6px',
    marginRight: '15px', 
    marginLeft: '15px', 
    "& label" : {
      paddingTop: "12px"
    }
  }, 
  formControl: {
    margin: theme.spacing(1),
  },
  textControl: {
    margin: theme.spacing(1),
    /* Following ensures TextInput (multiline) is "open" (1st five lines) when 
    ** with a scrollbar in case of text overflow.  The control should expand to 
    ** 10 ilnes but doesn't when it is initially hidden.  Modifying AutoForm
    ** PureComponent to rerender on menu focus would likely resolve this issue, 
    ** but the following remedy is good and performant too...
    */
    "& div>textarea:first-of-type" : {
      minHeight: "95px",
      overflowY: "scroll !important"
    }
  },
  fkDefaultLable: {
    /*
    ** Foreign key label placement hacks (focus vs. not vs. empty vs. filled)
    ** (I tried FormControlLabel instead of InputLabel but that hasn't helped yet)
    */
    "&": { left: 23, top: 3 },    
    "&.Mui-focused,&.MuiFormLabel-filled": { top: 0 }
  }
}));

export const AppField = ( props : { 
    fieldName:any,
    field:any,
    onChange:(newVal:any)=>(void) } 
) => 
{
  const { fieldName, onChange } = props;
  const classes = useStyles();
  const { appCol, referenceTableName, referenceTable } = useFieldMetadata(fieldName);
  const { AppColumn_title : appColTitle, AppColumn_data_type, 
          AppColumn_ui_minwidth, AppColumn_is_nullable, AppColumn_read_only, 
          AppColumn_character_maximum_length } = appCol;
//'*' flagging of required fields probably not required now that I highlight with error/red if empty...
//const appColTitle = AppColumn_is_nullable === "YES" ? AppColumn_title : AppColumn_title + ' *';
  const fieldType : string = referenceTable.length ? 'FK' : AppColumn_data_type;

  // Allow mutating and tracking current value to prevent number field rerendering
  // (see onChange in character varying data type TextField control)
  let { field } = props;    
  const flagEmptyRequiredField = AppColumn_is_nullable==="NO" && !field;

  let InputProps;
  let rv : JSX.Element;

  console.log('AppField');

  switch(fieldType) {

    case 'bit': // TODO: Test w/ Postgresql, might be 'boolean'....
      rv = (
      <div style = {{ 
            width: ( AppColumn_ui_minwidth || "198px")
           }} 
           className={classes.nowrap}>
        <InputLabel id = {"label"+fieldName}> 
          <Switch
            checked={field || false}
            onChange = {(e)=>{ onChange(e.target.checked) }}
            color="primary" />
          { appColTitle }
        </InputLabel>
      </div>)

      break;

    case 'integer' :
      if (fieldName.indexOf('_points')!==-1)
        InputProps = { inputComponent: NumberFormatPoints };
      else if (fieldName.indexOf('_hours')!==-1)
        InputProps = { inputComponent: NumberFormatHours };
      // Yes, fall through to 'character varying' code...

    case 'character varying' :
      // TODO: Eventually the following will be represented in meta-data...
      if (// 'character varying' criteria repeated, since we fall through
          // from the integer data type case too...
          fieldType==='character varying' 
          // Character fields w/o length are assumed to be large variable-
          // length fields that should receive textarea style controls...
          && !AppColumn_character_maximum_length)
        InputProps = { rows: "5", rowsMin: "5", rowsMax: "10", multiline: true };

      if (fieldName === 'user_password_hash')
        InputProps = { type: "password" };

      rv = (
        <TextField
          variant="outlined" 
          className={ classes.textControl }
          error={ flagEmptyRequiredField }  
          style = {{ minWidth: AppColumn_ui_minwidth || 
            ( AppColumn_character_maximum_length 
              || fieldType!=='character varying' ? "150px" : "100%" )
          }} 
          label = { appColTitle }
          value = { field==null 
            ? '' 
            : field // use space; null does not init control properly 
          }
          onChange = {(e)=>{
            if ( e.target.value.length <= (
              // varchar max limit for now to prevent large cut-and-paste operations for example 
              AppColumn_character_maximum_length || 65536 
            ) ) {
              if ( (field||'').toString() !== e.target.value ) {
                onChange(e.target.value); 
                // Track to prevent re-rendering from numeric field formatter
                field = e.target.value;   
              }
            }
          }}
          disabled = { AppColumn_read_only }
          InputProps = { InputProps }
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
            onChange={ dt => onChange(dt) } 
            InputProps = { InputProps }
            inputVariant = 'outlined'
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}/>
        </MuiPickersUtilsProvider>
      );
      break;

    case 'FK':
      rv = (
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
            onChange={ e => onChange(e.target.value) }>
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
      break;

    default :
      rv = <div>!!CONTROL NOT FOUND FOR DATA TYPE: { AppColumn_data_type }!!</div>
  }

  return rv; 
}

export function NumberFormatPoints(props:any) {
  const { inputRef, onChange, ...other } = props;
  return (
    <NumberFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={values => {
        onChange({
          target: {
            value: values.value,
          },
        });
      }}
      thousandSeparator
      isNumericString
      suffix = {' points'}
    />
  );
}

export function NumberFormatHours(props:any) {
  const { inputRef, onChange, ...other } = props;
  return (
    <NumberFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={values => {
        onChange({
          target: {
            value: values.value,
          },
        });
      }}
      thousandSeparator
      isNumericString
      suffix = {' hours'}
    />
  );
}
