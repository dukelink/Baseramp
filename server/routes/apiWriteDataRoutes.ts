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
import { cacheTable } from './cacheAppTables';
import bcrypt from "bcryptjs";
const knex = Knex(development);

type AuthenticatedRequest = Request & { user: any };

export const addApiWriteDataRoutes = (router : Router ) => 
{
    
     // Following posts must come last for now since '/:table' matches any single token!!!  TODO: Perhaps I should modify?
    router.post("/user", (req:AuthenticatedRequest,res) => 
        tablePostHandler(req,res,'user') ); // allow adding new users w/o authentication
    router.post("/:table", loggedInOnly, (req:AuthenticatedRequest,res) => 
        tablePostHandler(req,res,req.params.table) );

    async function tablePostHandler(req:AuthenticatedRequest,res:Response<any>,tableName:string) 
    {
        let record = req.body;

        await throwIfNotAuthorizedRoute(req, res,tableName);

        const primaryKeyField = tableName+'_id';
        let primaryKeyID;
        let fullRecordReadback;

        record = await businessRules(tableName, req, res, record);

        console.log(record)

        await knex
            .from(tableName)
            .insert(record, [primaryKeyField]) // TODO: validate against dd and handle nulls, etc.
            .then(async (data)=>{
                // console.log(data);
                primaryKeyID = data[0]; // Postgresql driver needs "[0][primaryKeyField]"
                // NOTE: Currently I relfect the added record just in case there are any computed fields...
                await knex(tableName)
                    .select('*')
                    .where(primaryKeyField,'=',primaryKeyID)
                    .then((data)=>{ fullRecordReadback = data }) 
                    .catch( (error) => { knexErrorHandler(req,res,error) } );           
            })
            .catch( (error) => { knexErrorHandler(req,res,error) } ); 

        let user_id;
        if (tableName==='user' && !req.user)
            user_id = fullRecordReadback[0]['user_id'];
        else
            user_id = (req.user as any).user_id
        await recordAuditTrail(  // TODO: Could run in parallel
            'INSERT',
            tableName,
            primaryKeyID,
            user_id, 
            fullRecordReadback[0]  // includes PK, default & calculated values :)
        );

        res.send(fullRecordReadback);
    }

    router.put("/:table/:id", loggedInOnly, 
    async function(req : AuthenticatedRequest , res) 
    {
        const tableName = req.params.table;
        let fullRecordReadback;

        await throwIfNotAuthorizedRoute(req,res,tableName);

        const primaryKeyField = tableName+'_id';
        let primaryKeyID = req.params.id;
        let recordDelta = req.body;
        let newPKID;

        await businessRules(tableName, req, res, recordDelta).
            then((data:any) => { recordDelta = data; });

        // HACK: May want to change structure of AppColumn/AppTable keys
        // and remove this...
        // If business rules updated primary key (e.g. FOR APPCOLUMN TABLE)
        // then capture new primary key id and erase it (since we cannot update PKs).
        if (newPKID = recordDelta[primaryKeyField]) {
            primaryKeyID = newPKID; 
            delete recordDelta[primaryKeyField];
        }

        await knex
            .from(tableName)
            .where(primaryKeyField,'=', primaryKeyID)
            .update(recordDelta) 
            .then(async (data)=>{
                // NOTE: Currently I relfect the added record just in case there are any computed fields...
                await knex(tableName)
                    .select('*')
                    .where(primaryKeyField,'=',primaryKeyID)
                    .then((data)=>{ fullRecordReadback = data }) 
                    .catch( (error) => { knexErrorHandler(req,res,error) } );           
            })         
            .catch( (error) => { knexErrorHandler(req,res,error) } ); 

        await recordAuditTrail(
            'UPDATE',
            tableName,
            primaryKeyID,
            req.user.user_id,
            recordDelta
        );
 
        res.send(fullRecordReadback);      
    });

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

        await Promise.all([
            cacheTable('role').recall(),
            cacheTable('AppTable').recall()
        ]).then((promises)=>{
            const [roles,appTables] = promises;
            if ( tableName != 'user'
                && roles[user_role_id]['role_title'] !== 'Admin'
                && appTables[tableName]['AppTable_role_id'] !== user_role_id
            ) {
                res.statusMessage 
                    = `You are not authorized to modify the '${tableName}' table.`;
                res.status(409).end();
                throw 409;
            }
        });

        return;
    }

    const businessRules = (tableName:string, req: Request, res: Response, record:any={}) => 
    {
        return new Promise( (resolve, reject) => {
            switch(tableName) 
            {
                case 'AppColumn' :
                    // HACK: Translate PK's back from column name to ID...
                    knex
                        .select('AppColumn_id')
                        .from('AppColumn')
                        .where('AppColumn_column_name','=',req.params.id)
                        // then() must come before catch() since we don't rethrow exception in knexErrorHandler
                        .then( data => {
                            const newRec = {...record, ...data[0]};
                            console.log(`modified record = ${JSON.stringify(newRec)}`);
                            resolve(newRec);
                        } )
                        .catch( (error) => { knexErrorHandler(req,res,error) } );
                    break;

                case 'user':
                    if (record.user_password_hash) 
                    {
                        let newUserRecord = {...record};

                        // hack: relies on current circumstance that
                        // new user routes do not include :table parameter.
                        // An assumption likely to hold, but a hack nonetheless...
                        if (tableName !== req.params.table)
                            // New user registration should not immediately grant access.
                            // Access will need to be approved by an existing.
                            // We can relax this once multi-tenancy is fully implemented...
                            newUserRecord.user_active = true // false; -- allow immediate new user signin for now (TODO 2 factory)

                        bcrypt.hash(
                            record.user_password_hash,
                            // TODO:
                            // re 3: 12 or higher is suggested for better encryption strength
                            // in production.  Also consider, adding 'pepper' or other hashing
                            // schemes.  High salting rounds increase CPU times and can create
                            // noticeable delays for user authentication but that is the
                            // source of the encryption strength.  Here's a discussion about adding 'pepper':
                            // https://security.stackexchange.com/questions/3272/password-hashing-add-salt-pepper-or-is-salt-enough?noredirect=1&lq=1
                            // Another option may be SHA-512:
                            // https://crypto.stackexchange.com/questions/46550/benchmark-differences-between-sha-512-and-bcrypt
                            3, 
                            (err,passwordHash) => {
                                if (err) 
                                    reject(err);
                                else
                                    resolve({
                                        ...newUserRecord,
                                        user_password_hash:passwordHash,
                                        // Default new users to 'User' role...
                                        user_role_id: record.user_role_id || 2 
                                    });
                            })
                    } else
                        resolve(record);
                    break;

                default:
                    resolve(record);
            }
        })
    }

    const recordAuditTrail = (updateType,tableName,tableID,reqUser,recordUpdates = {}) => 
    {
        return cacheTable('AppTable').recall()
            .then(appTables => {
                return (
                    knex
                    .from('audit')
                    .insert({
                        audit_user_id : reqUser,
                        audit_AppTable_id : appTables[tableName]['AppTable_id'],
                        audit_table_id : tableID,
                        audit_update_type : updateType,
                        audit_field_changes : JSON.stringify(recordUpdates)
                    })
            )})
    }
}

