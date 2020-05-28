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

import React, { ChangeEvent /*, memo*/ } from "react";
import { AppColumnRow } from "../../model/ModelTypes";
import { Switch, InputLabel, FormControl } from "@material-ui/core";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import { FieldText } from "./FieldText";
import { FieldFK } from "./FieldFK";
import { FieldMtoM } from "./FieldMtoM";
import { useStyles } from "./FieldStyles";

import { useFieldMetadata } from "../../model/ModelSelectors";

// NOTE: memoization does not help since the onChange callback
// currently changes on every field-level state change...
export const AppField = /*memo(*/ (props: {
  fieldName: any;
  field: any;
  navTable: string;
  navTableID: string;
  activeFilter?: boolean;
  onChange: (fieldName: string, newVal: any) => void;
  appCol: AppColumnRow;
}) => {
  const {
    fieldName,
    field,
    onChange,
    appCol,
    navTable,
    navTableID,
    activeFilter,
  } = props;
  const classes = useStyles();

  const { referenceTableName, referenceTable } = useFieldMetadata( // , appCol
    fieldName,
    field,
    navTable,
    navTableID,
    activeFilter
  );

  const {
    AppColumn_title: appColTitle,
    AppColumn_data_type,
    AppColumn_ui_minwidth,
    AppColumn_is_nullable,
    AppColumn_read_only,
    AppColumn_AppTable_junction_id,
  } = appCol;

  const flagEmptyRequiredField = AppColumn_is_nullable === "NO" && !field;

  console.log(
    `AppField(): fieldName=${fieldName}, field=${JSON.stringify(field)?.substr(
      0,
      40
    )}`
  );

  function onTextFieldChange(fieldName: string, newVal: string) {
    // Ensure numeric fields are being stored as numeric, the
    // Material-UI control implementation can convert these values to string,
    // which can mess with our 'dirty flag' detection...
    onChange(
      fieldName,
      AppColumn_data_type === "integer" ? Number(newVal) : newVal
    );
  }

  function onSwitchChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(fieldName, e.target.checked);
  }

  function onDatepickerChange(dt: any, val: string | null | undefined) {
    onChange(fieldName, val);
  }

  function onMtoMchange(fieldName: string, val: any) {
    console.log(`==== fieldName=${fieldName}, val=${JSON.stringify(val)}`);
    onChange(fieldName, val);
  }

  if (!!AppColumn_AppTable_junction_id) {
    // Many-to-many junction table multiselect control...
    return (
      <FieldMtoM
        {...{
          appCol,
          fieldName,
          field,
          referenceTableName,
          referenceTable,
          onChange: onMtoMchange,
        }}
      />
    );
  } else if (referenceTableName) {
    // Regular foreign key...
    return (
      <FieldFK
        {...{
          appCol,
          fieldName,
          field,
          referenceTableName,
          referenceTable,
          onChange,
        }}
      />
    );
  } else {
    let rv: JSX.Element;

    switch (AppColumn_data_type) {
      case "bit": // TODO: Test w/ Postgresql, might be 'boolean'....
        rv = (
          <div
            style={{
              width: AppColumn_ui_minwidth || "198px",
            }}
            className={classes.nowrap}
          >
            <InputLabel id={"label" + fieldName}>
              <Switch
                checked={field || false}
                onChange={onSwitchChange}
                color="primary"
              />
              {appColTitle}
            </InputLabel>
          </div>
        );

        break;

      case "integer":
      // Yes, fall through to 'character varying' code...
      case "character varying":
        rv = (
          <FieldText
            appCol={appCol}
            fieldName={fieldName}
            field={field}
            onChange={onTextFieldChange}
          />
        );
        break;

      case "date":
        // Note: KeyboardDatePicker should NOT be wrapped in FormControl (caused misalginment)
        rv = (
          <FormControl
            style={{
              width: AppColumn_ui_minwidth || "150px",
            }}
          >
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <KeyboardDatePicker
                className={classes.formControl}
                disableToolbar
                variant="inline"
                error={flagEmptyRequiredField}
                format="MM/dd/yyyy"
                margin="normal"
                label={appColTitle}
                value={field || null /* null works well for date fields */}
                disabled={AppColumn_read_only}
                onChange={onDatepickerChange}
                inputVariant="outlined"
                KeyboardButtonProps={{
                  "aria-label": "change date",
                }}
              />
            </MuiPickersUtilsProvider>
          </FormControl>
        );
        break;

      default:
        rv = (
          <div>!!CONTROL NOT FOUND FOR DATA TYPE: {AppColumn_data_type}!!</div>
        );
    }

    return rv;
  }
};
/* 
// REVIEW:
// Will require persisting an array of AppField controls I think...
// This memo() alone causes field values to be lost when editing
// other fields...  Might also be related to onChange redef...
, (prev,next) => (
  prev.navTable===next.navTable
  && prev.navTableID===next.navTableID
  && prev.fieldName===next.fieldName
  && prev.field===next.field )
)
*/
