/*
    Baseramp - An end user database system, 
    enabling personal data usage and private data ownership,
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

import React, { memo, ChangeEvent } from 'react';
import { AppColumnRow } from '../../model/ModelTypes';
import { TextField, FormControl } from '@material-ui/core';
import NumberFormat from 'react-number-format';
import { useStyles } from './FieldStyles';

export const FieldText = memo((props : {
        appCol: AppColumnRow, 
        fieldName: string, 
        field: any,
        onChange:(fieldName:string,newVal:any)=>(void)
}) => {
    const { appCol, fieldName, onChange } = props;
    const { AppColumn_title : appColTitle,
        AppColumn_ui_minwidth, AppColumn_read_only, AppColumn_is_nullable,
        AppColumn_data_type, AppColumn_character_maximum_length } = appCol;
    const classes = useStyles();     

    // Allow mutating and tracking current value to prevent number field rerendering
    // (see onChange in character varying data type TextField control)
    let { field } = props; 

    let InputProps = {};
    let FormatProps = {} as React.CSSProperties;

    // TODO/NOTE: A business rule repeated in other Field...tsx files...
    const flagEmptyRequiredField = AppColumn_is_nullable==="NO" && !field;

    console.log('<FieldText>');
    
    // TODO: Eventually the following will be represented in meta-data...
    if (// 'character varying' criteria repeated, since we fall through
        // from the integer data type case too...
        AppColumn_data_type==='character varying' 
        // Character fields w/o length are assumed to be large variable-
        // length fields that should receive textarea style controls...
        && !AppColumn_character_maximum_length)
      InputProps = { ...InputProps, rows: "5", rowsMin: "5", rowsMax: "10", multiline: true };

    if (fieldName === 'user_password_hash')
    InputProps = { ...InputProps, type: "password" };

    FormatProps = {
      width: AppColumn_ui_minwidth || '150px',
      minWidth: AppColumn_ui_minwidth 
          || ( AppColumn_character_maximum_length 
          ||   AppColumn_data_type !== 'character varying' ? "150px" : "100%" )
    };

    if (fieldName.indexOf('_points')!==-1)
        InputProps = { ...InputProps, inputComponent: NumberFormatPoints };
    else if (fieldName.indexOf('_hours')!==-1)
        InputProps = { ...InputProps, inputComponent: NumberFormatHours }; 
    
    const textField_onChange = (e : ChangeEvent<HTMLInputElement>)=>{
        if ( e.target.value.length <= (
            // varchar max limit for now to prevent large cut-and-paste operations for example 
            AppColumn_character_maximum_length || 65536 
        ) ) {
          let normalizedValue = e.target.value as string | null;
          if (AppColumn_is_nullable==='YES' && normalizedValue==='')
            normalizedValue = null;
          if ( field !== normalizedValue ) {
            // Track to prevent re-rendering from numeric field formatter
            // (otherwise this might not be needed)...
            field = normalizedValue;
            onChange(fieldName,field);
          }
        }
    }

    return (
      <FormControl style={FormatProps}>
        <TextField
            error={ flagEmptyRequiredField }
            size="small" 
            //variant="outlined"
            className={ classes.textControl }
            label = { appColTitle }
            value = { 
                field==null 
                    ? ''  
                    : field // use space; null does not init control properly
            }
            onChange = { textField_onChange }
            disabled = { AppColumn_read_only }
            InputProps = { InputProps }
        />    
      </FormControl>
    )
});

export function NumberFormatPoints(props:any) {
    const { inputRef, onChange, ...other } = props;
    return (
      <NumberFormat
        {...other}
        getInputRef={inputRef}
        onValueChange={values => {
          // TODO: Refactor to remove arrow function from event handler
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
          // TODO: Refactor to remove arrow function from event handler
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
  