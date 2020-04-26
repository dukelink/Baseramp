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

import { Router, Request, Response } from 'express';
import Knex from "knex";
import { development } from '../knexfile';
import { knexErrorHandler } from './util';
import { loggedInOnly } from './apiRoutes';
import { businessRules } from './apiBusinessRules';
import { cacheMetadata, tableSelect } from './apiReadDataRoutes';

const knex = Knex(development);

type AuthenticatedRequest = Request & { user: any };

export const addApiWriteDataRoutes = (router : Router ) => 
{
  // Following posts must come last for now since '/:table' matches 
  // any single token!!!  TODO: Perhaps I should modify?
  router.post("/user", (req:AuthenticatedRequest,res) => 
    tablePostHandler(req,res,'user') ); // allow adding new users w/o authentication
  router.post("/:table", loggedInOnly, (req:AuthenticatedRequest,res) => 
    tablePostHandler(req,res,req.params.table) );

  async function tablePostHandler(req:AuthenticatedRequest,res:Response<any>,tableName:string) 
  {
    await throwIfNotAuthorizedRoute(req, res,tableName);

    const primaryKeyField = tableName+'_id';
    let primaryKeyID;
    let fullRecordReadback;

    let { record, virtual } = await businessRules(tableName, req, res, req.body);

    await knex
      .from(tableName)
      .insert(record, [primaryKeyField]) 
      .then(async (data)=>{
        primaryKeyID = data[0]; // Postgresql driver returns "[0][primaryKeyField]"
        // Reread and reflect the full record in the response
        // so the client can discover new identity field ids
        // or any SQL computed fields...
        await knex(tableName)
          .select('*')
          .where(primaryKeyField,'=',primaryKeyID)
          .then( (data)=>{ fullRecordReadback = data[0] } ) 
          .catch( (error) => { knexErrorHandler(req,res,error) } );           
      })
      .catch( (error) => { knexErrorHandler(req,res,error) } ); 

    let user_id;
    if (tableName==='user' && !req.user)
      user_id = fullRecordReadback['user_id'];
    else
      user_id = (req.user as any).user_id

    updateJunctionTables(primaryKeyID,virtual);

    // TODO: Wrap record write and audit trail write in a transaction
    await recordAuditTrail(
      'INSERT',
      tableName,
      primaryKeyID,
      user_id, 
      // HACK: return many-to-many lists via ...req.body...
      { ...req.body, ...fullRecordReadback } 
    );

    // HACK: return many-to-many lists via ...req.body...
    res.send({...req.body, ...fullRecordReadback}); 
  }

  router.put("/:table/:id", loggedInOnly, 
  async function(req : AuthenticatedRequest , res) 
  {
    const tableName = req.params.table;
    let fullRecordReadback;

    await throwIfNotAuthorizedRoute(req,res,tableName);

    const primaryKeyField = tableName+'_id';
    let primaryKeyID = req.params.id;
    //let newPKID;

    const { record: recordDelta, virtual } 
      = await businessRules(tableName, req, res, req.body);

      /*
    // HACK: May want to change structure of AppColumn/AppTable keys
    // and remove this...
    // If business rules updated primary key (e.g. FOR APPCOLUMN TABLE)
    // then capture new primary key id and erase it (since we cannot update PKs).
    if (newPKID = recordDelta[primaryKeyField]) {
      primaryKeyID = newPKID; 
      delete recordDelta[primaryKeyField];
      // Same goes for foreign key in AppColumn...
      //if (recordDelta['AppColumn_AppTable_id'])
      //  delete recordDelta['AppColumn_AppTable_id']
    }
      */

    if (Object.keys(recordDelta).length)
      await knex
        .from(tableName)
        .where(primaryKeyField,'=', primaryKeyID)
        .update(recordDelta) 
        .then() // Needed to run query 
        .catch( (error) => { knexErrorHandler(req,res,error) } ); 

    // NOTE: Currently I relfect the added record just in case there are any computed fields...
    // Reflect via tableSelect() since that contains biz rules 
    // (e.g. for AppTable/AppColumn)...
    await tableSelect(tableName)
      .where(tableName+'.'+primaryKeyField,'=',primaryKeyID)
      .then( (data) => { fullRecordReadback = data[0] } ) 
      .catch( (error) => { knexErrorHandler(req,res,error) } );  

    updateJunctionTables(primaryKeyID,virtual);

    await recordAuditTrail(
      'UPDATE', 
      tableName,
      primaryKeyID,
      req.user.user_id,
      // HACK: return many-to-many lists via ...req.body...
      { ...req.body, ...recordDelta } 
    );
 
    res.send({...req.body, ...fullRecordReadback});      
  });

  function updateJunctionTables(
    pkID:string,
    virtual:Array<any>)
  {
    return new Promise( async (resolve,reject) => {
      // Process each junction table independently
      (new Set(virtual.map(item => item.table as string)))
      .forEach( async junctionTable => 
      {
        // Fetch current set of FK items select
        const enteredItems = virtual
          .filter(item => (item.table as string)===junctionTable);
        const enteredIDs = enteredItems.map(item => item.fkID);

        // Get select FK items current on-file (may need updating)
        let existingIDs : Array<number> = []; 
        const selectQuery = knex
          // Following assumes only 1 fkField exists per reference junction table
          // (just picking from first entry; we could add an assertion test here)
          .select(junctionTable+'_'+enteredItems[0].fkField) 
          .from(junctionTable)
          .where(junctionTable+"_id","=",pkID);
        await selectQuery
        .then(data => {
          existingIDs = data.map(item=>Object.values(item)[0] as number)
        });

        const IDsToDelete = existingIDs.filter(id => !enteredIDs.includes(id));
        const IDsToAdd = enteredIDs.filter(id => id // skip undefined, see biz rules
          && !existingIDs.includes(id));

        // Delete entries no longer selected...
        if (IDsToDelete.length) {
          knex.delete()
            .from(junctionTable)
            .where(junctionTable+"_id","=",pkID)
            .whereIn(junctionTable+'_'+enteredItems[0].fkField, IDsToDelete)
            .then();
        }

        // Add newly selected items...
        if (IDsToAdd.length) {
          const itemsToAdd = enteredItems
            .filter(item => IDsToAdd.includes(item.fkID))
            .map(item => ({ 
              [item.table+'_id'] : pkID,
              [item.table+'_'+item.fkField] : item.fkID 
            }));
          knex
            .insert(itemsToAdd)
            .from(junctionTable)
            .then();
        }
        resolve();
      })
    });
  }

  router.delete("/:table/:id", loggedInOnly, 
  async function(req : AuthenticatedRequest, res) 
  {
    const tableName = req.params.table;
    const primaryKeyField = tableName+'_id';
    const primaryKeyID = req.params.id;

    await throwIfNotAuthorizedRoute(req,res,tableName);

    if (tableName==='user') {
      // Deprecate by 'renaming' user; this preserves audit trail
      await knex
        .from(tableName)
        .where(primaryKeyField,'=', primaryKeyID)
        .update({
          user_title: 'delete-'+primaryKeyID,
          user_login: 'delete-'+primaryKeyID,
          user_active: 0
        }) 
        // then() must come before catch() since we don't rethrow exception in knexErrorHandler
        .then( ()=> {
          recordAuditTrail( 
            'DELETE',
            tableName,
            primaryKeyID,
            req.user.user_id
          )
          // then() must come before catch() since we don't rethrow exception in knexErrorHandler
          .then( () => { res.status(200).end(); } ) 
          // Note: we rely on SQL declarative RI to avoid orphan records; 
          // hence 'catch()' will occur in these cases to surface message to UI 
          .catch( (error) => { knexErrorHandler(req,res,error) } );
        })
        .catch( (error) => { knexErrorHandler(req,res,error) } ); 
    } else {
      knex
        .from(tableName)
        .where(primaryKeyField, '=', primaryKeyID)
        .delete() 
        // then() must come before catch() since we don't rethrow exception in knexErrorHandler
        .then( ()=> {
          recordAuditTrail( 
            'DELETE',
            tableName,
            primaryKeyID,
            req.user.user_id
          )
          // then() must come before catch() since we don't rethrow exception in knexErrorHandler
          .then( () => { res.status(200).end(); } ) 
          // Note: we rely on SQL declarative RI to avoid orphan records; 
          // hence 'catch()' will occur in these cases to surface message to UI 
          .catch( (error) => { knexErrorHandler(req,res,error) } );
        })
        .catch( (error) => { knexErrorHandler(req,res,error) } ); 
    }
  });

  const throwIfNotAuthorizedRoute = async (req : AuthenticatedRequest, res : Response, _tableName ?: string) =>
  {
    //
    // Consider replacing route auth middleware with a version of this.
    // RESEARCH: throw <string|string|??> vs. throw new Error(<string>):
    //  https://stackoverflow.com/questions/42453683/how-to-reject-in-async-await-syntax
    //
    const tableName = _tableName || req.params.table;
    const method = req.method;

    if (!tableName) {
      res.statusMessage 
        = `${method} method routes need a table name.`;
      res.status(400).end();
      throw 400;
    }

    if (['POST','PUT'].includes(method) 
        && !Object.keys(req.body).length) {
      res.statusMessage 
        = `${method} method routes need at least one field within the JSON body.`;
      res.status(400).end();
      throw 400;
    }            

    const user_role_id = req.user.user_role_id;
    const user_id = req.user.user_id;

    if (tableName != 'user' && !user_id) {
      console.log(`NO USER INFO: ${JSON.stringify(req?.user)}`);
      res.statusMessage 
        = `Your session is closed; please login again.`; 
      res.status(409).end();
      throw 409;
    }

    const { AppTable } = cacheMetadata;
    if ( tableName != 'user'
      && user_role_id !== 1 // 'Admin'; TODO: Remove hard code???
      && AppTable[tableName]['AppTable_role_id'] !== user_role_id
    ) {

      res.statusMessage 
        = `You are not authorized to modify the '${tableName}' table.`;
      console.log(`${res.statusMessage}\nuser_role_id=${user_role_id};\ntable role = ${JSON.stringify(Object.keys(AppTable[tableName]))}`);

      res.status(409).end();
      throw 409;
    }

    return;
  }

  const recordAuditTrail = (updateType,tableName,tableID,reqUser,recordUpdates = {}) => 
  {
    const { AppTable } = cacheMetadata;
    return (
      knex
      .from('audit')
      .insert({
        audit_user_id : reqUser,
        audit_AppTable_id : AppTable[tableName]['_id'],
        audit_table_id : tableID,
        audit_update_type : updateType,
        audit_field_changes : JSON.stringify(recordUpdates)
      })
    )
  }
}

