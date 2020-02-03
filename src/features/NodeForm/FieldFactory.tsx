import React from 'react';

import { FormControlLabel, FormControl, TextField, Select, Switch, MenuItem, InputLabel, makeStyles } 
  from '@material-ui/core';
import NumberFormat from 'react-number-format';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers'; 

import { RootState } from '../../rootReducer'; 
import { selectFieldMetadata } from '../../model/ModelSlice';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: theme.spacing(1),
  }
}));

export const AppField = ( props : { 
    fieldName:any,
    field:any,
    rootState:RootState,
    onChange:(newVal:any)=>(void) } 
) => 
{
  const { fieldName, rootState, onChange } = props;
  const classes = useStyles();  
  const { appCol, referenceTableName, referenceTable } 
    = selectFieldMetadata(rootState,fieldName);
  const fieldType : string = referenceTable.length ? 'FK' : appCol['AppColumn_data_type'];

  let InputProps;
  let rv : JSX.Element;
  // Allow mutating and tracking current value to prevent number field rerendering
  // (see onChange in character varying data type TextField control)
  let { field } = props;    

  console.log('AppField');

  switch(fieldType) {

    case 'bit': // TODO: Test w/ Postgresql, might be 'boolean'....
      rv = (
        <FormControlLabel
          control={
            <Switch
              checked={field}
              onChange = {(e)=>{ onChange(e.target.checked) }}
              value="ignore"
              color="primary"
            />
          }
          label={appCol['AppColumn_title']} 
      />
      );
      break;

    case 'integer' :
      switch (fieldName) {
        case 'story_points':
          InputProps = { inputComponent: NumberFormatPoints };
          break;
        case 'story_hours_planned':
        case 'story_hours_spent':
          InputProps = { inputComponent: NumberFormatHours };
          break;
      }
      // Yes, fall through to 'character varying' code...

    case 'character varying' :
      // TODO: Eventually the following will be represented in meta-data...
      if (fieldName.split('_').pop()==='description')
        InputProps = { rows: "5", rowsMax: "10", multiline: true };
      rv = (
        <TextField
          className={ classes.formControl }
          style = {{ minWidth: appCol['AppColumn_ui_minwidth'] || "150px"}}
          label = { appCol['AppColumn_title'] }
          value = { field==null ? '' 
                                : field // use space; null does not init control properly 
                  }
          onChange = {(e)=>{
            if ( e.target.value.length <= (appCol['AppColumn_character_maximum_length'] 
                || 65536 // varchar max limit for now to prevent large cut-and-paste operations for example 
            ) ) {
              if ( (field||'').toString() !== e.target.value ) {
                onChange(e.target.value); 
                // Track to prevent re-rendering from numeric field formatter
                field = e.target.value;   
              }
            }
          }}
          required = { !appCol['AppColumn_is_nullable'] }
          disabled = { appCol['AppColumn_read_only'] }
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
              width: (appCol['AppColumn_ui_minwidth'] || "150px")
            }}
            disableToolbar
            variant="inline"
            format="MM/dd/yyyy"
            margin="normal"
            label = { appCol['AppColumn_title'] }
            value = { field || null /* null works well for date fields */ }
            required = { !appCol['AppColumn_is_nullable'] }
            disabled = { appCol['AppColumn_read_only'] }
            onChange={ dt => onChange(dt) } 
            InputProps = { InputProps }
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}/>
        </MuiPickersUtilsProvider>
      );
      break;

    case 'FK':
      rv = (
        <FormControl 
          className={classes.formControl}
          style = {{ 
            width: (appCol['AppColumn_ui_minwidth'] || "198px")
          }} >
          <InputLabel id = {"label"+fieldName}>{ appCol['AppColumn_title'] }</InputLabel>
          <Select
            labelId = {"label"+fieldName}
            required = { !appCol['AppColumn_is_nullable'] }
            disabled = { appCol['AppColumn_read_only'] }
            value={ field || '' }
            onChange={ e => onChange(e.target.value) }>{
              referenceTable.map((row:any) => (
                <MenuItem 
                    key = { row[referenceTableName+'_id'] } 
                    value = { row[referenceTableName+'_id'] }>
                  { row[referenceTableName+'_title'] }
                </MenuItem>
              ))
            }          
            <MenuItem>{
              // TODO: Make conditional to allow nullification only of nullable fields; 
              //       also review styling of the 'blank' entry.
            }</MenuItem>
          </Select>
        </FormControl>
      );
      break;

    default :
      rv = <div>!!CONTROL NOT FOUND FOR DATA TYPE: {appCol['AppColumn_data_type']}!!</div>
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
