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
import { FormControl, Select, MenuItem, InputLabel } 
  from '@material-ui/core';
import { useStyles } from './FieldStyles';
import { Records } from '../../model/ModelTypes';

export const FieldFK = memo((props : {
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
                value={ (field || '') }
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
}); 
