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

import { Router, Request } from 'express';
import Knex from "knex";
import { development } from '../knexfile';
import { knexErrorHandler } from './util';
import { loggedInOnly } from './apiRoutes';

// Note: client always hits /meta route first, so all
// other middle tier code can assume this data exists.
export let cacheMetadata : { [tableName:string] : any } = {}; 

const knex = Knex(development);

const userTables = [
  'category',
  'sprint',
  'project',
  'story',
  //,'task'
  'requirement',
  'challenge',
  'resource',
  'response',
  'account',
  'sale',
  'chore',
  'checkoff'
];

/*
// See hard-coded aggregates and left joins after around line 200 below
const M2Mtables = [
  'StoryStory',
  'StoryRequirement',
  'StatusAppTable',
  'CategoryAppTable'
];
*/

const adminTables = [
  'status'
];

const securityTables = [
  'user', 
  'role'
]

const metaTables = [
  'AppTable',
  'AppColumn'
];

class apiRoute {
  path : string;
  method : string;
  tables : Array<{name:string}>;
  authProtected : boolean;
  constructor(
    path : string,
    method : string,
    tables : Array<{name:string}>, 
    authProtected : boolean = true)
  {
    this.path = path;
    this.method = method;
    this.tables = tables;
    this.authProtected = authProtected;
  }
}

let getRoutes = [
  ( new apiRoute('/all', 'get',
    [ ...userTables, ...adminTables, ...metaTables ]
      .map( (tableName) => {
        return {
          name: tableName
        } } )
  ) ) ];

// TODO: Pull from cache?
getRoutes.push(    
  (new apiRoute('/meta','get',
    metaTables
      .map( (tableName) => {
        return {
          name: tableName
        }}), false
  ))
)

getRoutes.push(    
  (new apiRoute('/security','get',
    securityTables
      .map( (tableName) => {
        return {
          name: tableName
        }}), true
  ))
)

export function tableSelect(tableName : string, path?:string) 
{
  switch (tableName) {
    //
    // TODO: Metadata has been reshaped to use table names instead of surrogate keys
    //       as a likely new convention to afford the greatest simplicity to consume
    //       this data within the client application.  Consider changing the physical
    //       metadata tables to reflect this change. 
    //
    case 'AppTable':
      if (path==='/meta')
        return knex.select(
          'AppTable_id as _id',
          'AppTable_table_name as AppTable_id',
          'AppTable_title',
          'AppTable_description',
          'AppTable_rank',
          'AppTable_table_name',
          'AppTable_role_id',
          "role.role_title"
        ).from('AppTable')
        .leftJoin('role','AppTable_role_id','role_id');
      else
      //
      // TODO: Consider deriving role_title on
      // client side...?
      //
        return knex.select(
          'AppTable_id as _id',
          'AppTable_id',
          'AppTable_title',
          'AppTable_description',
          'AppTable_rank',
          'AppTable_table_name',
          'AppTable_role_id',
          "role.role_title"
        ).from('AppTable')
        .leftJoin('role','AppTable_role_id','role_id');
      break;
    case 'AppColumn':
      if (path==='/meta')
        return knex.select(
          'AppColumn.AppColumn_column_name as AppColumn_id', 
          'AppColumn.AppColumn_title',
          'AppColumn.AppColumn_description',
          'AppColumn.AppColumn_rank',
          'AppTable.AppTable_table_name as AppColumn_AppTable_id',
          'AppColumn.AppColumn_ui_hidden',
          'AppColumn.AppColumn_ui_minwidth',
          'AppColumn.AppColumn_read_only',
          'AppColumn.AppColumn_column_name',
          'AppColumn.AppColumn_is_nullable',
          'AppColumn.AppColumn_data_type',
          'AppColumn.AppColumn_character_maximum_length',
          'AppColumn.AppColumn_column_default',
          'AppColumn.AppColumn_is_computed',
          'AppColumn_related.AppColumn_column_name as AppColumn_related_pk_id',
          'AppTable_junction.AppTable_table_name as AppColumn_AppTable_junction_id'
        ).from('AppColumn')
          .innerJoin('AppTable','AppColumn_AppTable_id','AppTable_id')
          .leftJoin('AppColumn as AppColumn_related','AppColumn.AppColumn_related_pk_id','AppColumn_related.AppColumn_id')
          .leftJoin('AppTable as AppTable_junction','AppColumn.AppColumn_AppTable_junction_id','AppTable_junction.AppTable_id');         
      break;
    //
    // ...TODO END
    //
    case 'user':
    {
      // No need to include user password even though it is hashed
      // and even though we only download user data to admin users...
      return knex.select(
        'user_id', 
        'user_title', 
        'user_login', 
        'user_active', 
        'user_email', 
        'user_phone', 
        'user_role_id',
        knex.raw(`'********' as user_password_hash`)
      )
      .from('user')
      .whereNot('user_login','like','delete-%');            
      break;
    }
  }
  return knex.select('*').from(tableName);
}

export const addApiReadDataRoutes = async (router : Router ) => 
{    
  for (let x of getRoutes) {
    const { path, tables, method, authProtected } = x;
    console.log(path);
    router[method](path, authProtected?loggedInOnly:[], async function(req,res) 
    {
      let results = {};

      // Use procedural loop and 'await' to confirm potential performance
      // benefit is worth the additional work for parallel processing...
      for (let x of tables) { 
        const { name: tableName } = x; 

        const user_id = (req.user as any)?.user_id;

        // User tables filter rows by user 'ownership'
        if (!metaTables.includes(tableName) && !securityTables.includes(tableName)) {
          //const query =  knex.select('*').from(tableName);

          console.log(`PATH ${path}, user_id ${user_id}`)
       
          let ownedRows = 
            knex
              .select('audit_table_id',
                knex.raw(`
                  max(case when audit_field_changes like '%_StoryStory_%'
                  then audit_id else -1 end) as latest_StoryStory_audit_id`),
                knex.raw(`
                  max(case when audit_field_changes like '%_StoryRequirement_%'
                  then audit_id else -1 end) as latest_StoryRequirement_audit_id`),
                knex.raw(`
                  max(case when audit_field_changes like '%_StatusAppTable_%'
                  then audit_id else -1 end) as latest_StatusAppTable_audit_id`),
                knex.raw(`
                  max(case when audit_field_changes like '%_CategoryAppTable_%'
                  then audit_id else -1 end) as latest_CategoryAppTable_audit_id`)
              )
              .max({latest_audit_id:'audit_id'})  
              .from('audit')
              .innerJoin('AppTable', 'audit_AppTable_id', 'AppTable_id')
              .where('AppTable_title', '=', tableName);

          // User tables filter rows by user 'ownership'
          if (userTables.includes(tableName))
            ownedRows = ownedRows
              .where('audit_user_id', '=', user_id);
          
          ownedRows = ownedRows.groupBy('audit_table_id');

          console.log(`NOT ADMIN - filtered; PATH=${path}, tableName=${tableName}, user_id=${user_id}`)
          const query = knex.raw('with auditLastOwned as (?) ?', [
            ownedRows,
            knex.select(tableName+'.*',
              'audit_StoryStory.audit_field_changes as StoryStory_ids',
              'audit_StoryRequirement.audit_field_changes as StoryRequirement_ids',
              'audit_StatusAppTable.audit_field_changes as StatusAppTable_ids',
              'audit_CategoryAppTable.audit_field_changes as CategoryAppTable_ids'
            )
            .from(tableName)
            .innerJoin( 'auditLastOwned',
              'auditLastOwned.audit_table_id','=',tableName+'_id' )
            .leftJoin('audit as audit_StoryStory',
              'audit_StoryStory.audit_id','=','auditLastOwned.latest_StoryStory_audit_id')
            .leftJoin('audit as audit_StoryRequirement',
              'audit_StoryRequirement.audit_id','=','auditLastOwned.latest_StoryRequirement_audit_id')
            .leftJoin('audit as audit_StatusAppTable',
              'audit_StatusAppTable.audit_id','=','auditLastOwned.latest_StatusAppTable_audit_id')
            .leftJoin('audit as audit_CategoryAppTable',
              'audit_CategoryAppTable.audit_id','=','auditLastOwned.latest_CategoryAppTable_audit_id')
          ]);

//console.log('//////////////////////////////////')
//console.log(JSON.stringify(query.toString()));
//console.log('\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\')

          await query.then( (data) => {
            console.log(`${tableName} rows read = ${data.length}`)
            results[tableName] = data.reduce(
              (prevVal,currVal) => {
                const { StoryStory_ids, StoryRequirement_ids, StatusAppTable_ids, CategoryAppTable_ids } = currVal;
                let latest_m2m_updates = {};
                if (StoryStory_ids) {
                  Object.assign(latest_m2m_updates, 
                    { story_StoryStory_story_id : JSON.parse(StoryStory_ids).story_StoryStory_story_id } );
                  delete currVal.StoryStory_ids;
                }
                if (StoryRequirement_ids) {
                  Object.assign(latest_m2m_updates, 
                    { story_StoryRequirement_requirement_id : JSON.parse(StoryRequirement_ids).story_StoryRequirement_requirement_id } );
                  delete currVal.StoryRequirement_ids;
                }
                if (StatusAppTable_ids) {
                  Object.assign(latest_m2m_updates, 
                    { status_StatusAppTable_AppTable_id : JSON.parse(StatusAppTable_ids).status_StatusAppTable_AppTable_id } );
                  delete currVal.StatusAppTable_ids;
                }
                if (CategoryAppTable_ids) {
                  Object.assign(latest_m2m_updates, 
                    { category_CategoryAppTable_AppTable_id : JSON.parse(CategoryAppTable_ids).category_CategoryAppTable_AppTable_id } );
                  delete currVal.CategoryAppTable_ids;
                }
                // Incorporate many-to-many, virtual fields with latest record...
                prevVal[currVal[tableName+'_id']] = Object.assign(latest_m2m_updates, currVal);;
                return prevVal;
              }, {});
          })
          .catch((error)=>{knexErrorHandler(req,res,error)});       

        } 
        
        else if ( !securityTables.includes(tableName) 
          || (req.user as any)?.role_title === 'Admin' )
        {
          
          console.log(`ADMIN - NOT filtered; PATH=${path}, tableName=${tableName}`)
          await tableSelect(tableName,path)
            .then((data)=>{
              console.log(`${tableName} rows read = ${data.length}`)
              results[tableName] = data.reduce(
                (prevVal,currVal) => {
                  prevVal[currVal[tableName+'_id']] = currVal;
                  return prevVal;
                }, {});
          })
          .catch((error)=>{knexErrorHandler(req,res,error)});
        }
      }

      if (path==='/meta')
        cacheMetadata = results;

      res.send(results);
    });
  }

  //
  // Fetch audit records starting from a particular ID
  // NOTE: identity column IDs are assumed to be assigned in
  // chronological order which is how SQL handles them starting
  // form a 'seed' value. The system administrator should not
  // perform any maintenance that would result in IDs not following
  // this pattern.
  //
  router.get("/audit_updates/:from_id", loggedInOnly,
  function(req : Request , res) 
  {
    const fromID = req.params.from_id;

    const user_id = (req.user as any)?.user_id;

    // Filter on "admin" records or
    // records created under "my" login 
    // which is currently how we identify 
    // "owned" records...
    const query = ( (knex as any)[
        (fromID==='-1' ? 'first' : 'select' )] as typeof knex.select )  
      ( // TODO/REVIEW: Does 'first' (above) do a 'top 1' or does it "over query"!!!
        // (Couldn't find sufficient docs/examples to explicitly introduce a 'top 1' clause)
        'audit_id',
        'AppTable_table_name as table_name', 
        'audit_table_id as table_id',
        'audit_update_type as update_type',
        'audit_field_changes as field_changes' )
      .from('audit')
      .join('AppTable',function() { this
        .on('audit_AppTable_id','=','AppTable_id')
        // stuck an 'and' filter into join, to simplify where clause ORs
        .andOn('audit_id','>', knex.raw('?',[fromID]))
      })
      .join('role','AppTable_role_id','role_id')
      .where('role_title','=','Admin')
      .orWhere('audit_user_id','=',user_id)
      // hold up on trying to 'sync' metadata for now...
      // .whereNotIn('AppTable_table_name',['AppTable','AppColumn']) 
      // apply updates in order
      .orderBy('audit_id', fromID==='-1'?'desc':'asc');

    // NOTE: Can serialize generated query text to assist with troubleshooting
    // console.log(`audit query = ${query.toString()}`);

    query
      .then( (data) => { 
        if (fromID==='-1')
          data = [ data ]; // adjust for 'first' vs 'select' query
        
        // Strip out password hashes - never needed by client
        data.map((auditRec)=>{
          const field_changes = JSON.parse(auditRec.field_changes);
          if (field_changes.user_password_hash) {
            delete field_changes.user_password_hash;
            auditRec.field_changes = JSON.stringify(field_changes);
          }
          return auditRec;
        });

        res.send(data) 
      } )      
      .catch( (error) => { knexErrorHandler(req,res,error) } ); 
  });
}
