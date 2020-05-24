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

import { OutlineNode } from './ModelOutline';

export interface RecordOfAnyType { [key:string]:any; }
export interface Records<T> { [key:string]:T; }
export interface ViewModelState { [key:string]:Records<any>; }
export interface RecordDerived {
  closedItem: boolean,
  inProgress: boolean,
  record: RecordOfAnyType
}
export interface ViewModelDerived  { [key:string]:Records<RecordDerived>; } 

export interface AppTableRow {
  _id:number, // helpful reverse look of id from table name!
  AppTable_id: string;
  AppTable_title: string;
  AppTable_description?: string;
  AppTable_rank?: number;
  AppTable_table_name: string;
  role_title:string;
}

type AppColumnTypes = 
  'bit' | 'character varying' | 'date' | 'datetimeoffset' | 'integer' | 'text';

// create class w/ constructor to shortcut usage w/ xref feature:
export class AppColumnRow {
  constructor(  
    fieldName : string,
    tableName : string,
    relatedPkID : string = '',
    dataType : AppColumnTypes = 'character varying',
    fieldWidth : number = 0,
    uiHidden : boolean = true,
    isNullable : boolean = true
  ) {
    this.AppColumn_id 
      = this.AppColumn_title
      = this.AppColumn_column_name = fieldName;
    this.AppColumn_AppTable_id = tableName;
    this.AppColumn_ui_hidden = uiHidden;
    this.AppColumn_is_nullable = isNullable?'YES':'NO';
    this.AppColumn_data_type = dataType;
    this.AppColumn_character_maximum_length = fieldWidth || undefined;
    this.AppColumn_related_pk_id = relatedPkID;
  }

  AppColumn_id: string;
  AppColumn_title: string;
  AppColumn_description?: string;
  AppColumn_rank: number = 0;
  AppColumn_AppTable_id: string;
  AppColumn_ui_hidden: boolean;
  AppColumn_ui_minwidth?: number;
  AppColumn_read_only: boolean = false;
  AppColumn_column_name: string;
  AppColumn_is_nullable: string;
  AppColumn_data_type: AppColumnTypes;
  AppColumn_character_maximum_length?: number;
  AppColumn_column_default?: any;
  AppColumn_related_pk_id?: string;
  AppColumn_AppTable_junction_id?: string;
}

export interface IMetaModelState {
  AppTable : Records<AppTableRow>, 
  AppColumn : Records<AppColumnRow>
}

export interface Model {
  apiModel: ViewModelState,
  derivedModel: ViewModelDerived,
  metaModel: IMetaModelState,
  outline: OutlineNode[],
  inactive_status_ids: number[],
  inprogress_status_ids: number[]
}

export interface AuditUpdate {
  audit_id : number,
  table_name : string;
  table_id : Number; 
  update_type : 'INSERT'|'UPDATE'|'DELETE';
  field_changes : string;
}
