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

import { Router, Request, Response } from 'express';
import Knex from "knex";
import { development } from '../knexfile';
import { knexErrorHandler } from './util';
import { cacheTable } from './cacheAppTables';
import bcrypt from "bcryptjs";
const knex = Knex(development);

type AuthenticatedRequest = Request & { user: any };

export const addApiWriteDataRoutes = (router : Router ) => 
{
    // Authentication Middleware
    const loggedInOnly = (req, res, next) => {
        if (req.isAuthenticated()) 
            next();
        else 
            res.status(401).end();
    };

    const loggedOutOnly = (req, res, next) => {
        if (req.isUnauthenticated()) 
            next();
        else 
            res.end();
    };

    // Following posts must come last for now since '/:table' matches any single token!!!  TODO: Perhaps I should modify?
    router.post("/user", (req,res) => tablePostHandler(req,res,'user') ); // allow adding new users w/o authentication
    router.post("/:table", loggedInOnly, (req,res) => tablePostHandler(req,res,req.params.table) );

    async function tablePostHandler(req:Request<any>,res:Response<any>,tableName:string) 
    {
        let record = req.body;

        await roleAuthorizedRoute(req,res,tableName).then((authorized)=>{
            // roleAuthorizedRoute handles error response, 
            // so just return if not authorized...
            if (!authorized) return;    
        });

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
                primaryKeyID = data[0]; // Note: Postgresql needed "[0][primaryKeyField]" but not MS SQL???
                // NOTE: Currently I relfect the added record just in case there are any computed fields...
                await knex(tableName)
                    .select('*')
                    .where(primaryKeyField,'=',primaryKeyID)
                    // TODO: Perhaps we should return data[0] but this'll require client change and to recordAuditTrail call...
                    .then((data)=>{ fullRecordReadback = data }) 
                    // TODO: Can/should we differentiate (for client) between an error here and on the insert itself???
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
            fullRecordReadback[0]  // Will include any default values, as well as the identity primary key field :)
        );

        res.send(fullRecordReadback);
    }

    router.put("/:table/:id", loggedInOnly, 
    async function(req : AuthenticatedRequest , res) 
    {
        const tableName = req.params.table;

        await roleAuthorizedRoute(req,res).then((authorized)=>{
            // roleAuthorizedRoute handles error response, 
            // so just return if not authorized...
            if (!authorized) return;    
        });

        const primaryKeyField = tableName+'_id';
        let primaryKeyID = req.params.id;
        let recordDelta = req.body;
        let newPKID;

        await businessRules(tableName, req, res, recordDelta).
            then((data:any) => { recordDelta = data; });

        // HACK: May want to change structure of AppColumn/AppTable keys
        // and remove this...
        // If business rules updated primary key (e.g. for AppColumn table)
        // then capture new primary key id and erase it (since we cannot update PKs).
        if (newPKID = recordDelta[primaryKeyField]) {
            primaryKeyID = newPKID; 
            delete recordDelta[primaryKeyField];
        }

        await knex
            .from(tableName)
            .where(primaryKeyField,'=', primaryKeyID)
            .update(recordDelta) 
            .catch( (error) => { knexErrorHandler(req,res,error) } ); 

        await recordAuditTrail(
            'UPDATE',
            tableName,
            primaryKeyID,
            req.user.user_id,
            recordDelta
        );

        res.status(200).end();        
    });

    router.delete("/:table/:id", loggedInOnly, 
    async function(req : AuthenticatedRequest, res) 
    {
        const tableName = req.params.table;
        const primaryKeyField = tableName+'_id';
        const primaryKeyID = req.params.id;

        await roleAuthorizedRoute(req,res).then((authorized)=>{
            // roleAuthorizedRoute handles error response, 
            // so just return if not authorized...
            if (!authorized) return;    
        })

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

    const roleAuthorizedRoute = async (req : Request, res : Response, _tableName ?: string) =>
    {
        const tableName = _tableName || req.params.table;
        const method = req.method;

        if (!tableName) {
            res.statusMessage 
                = `${method} method routes need a table name.`;
            res.status(400).end();
            return false;
        }

        if (['POST','PUT'].includes(method) 
                && !Object.keys(req.body).length) {
            res.statusMessage 
                = `${method} method routes need at least one field within the JSON body.`;
            res.status(400).end();
            return false;
        }            

        const { user_role_id, user_id } = req.user;

        if (!user_id) {
            res.statusMessage 
                = `Your session is closed; please login again.`;
            res.status(409).end();
            return false;
        }

        await Promise.all([
            cacheTable('role').recall(),
            cacheTable('AppTable').recall()
        ]).then((promises)=>{
            const [roles,appTables] = promises;
            if ( roles[user_role_id]['role_title'] !== 'Admin'
                && appTables[tableName]['AppTable_role_id'] !== user_role_id
            ) {
                res.statusMessage 
                    = `You are not authorized to modify the '${tableName}' table.`;
                res.status(409).end();
                return false;
            }
        });

        return true;
    }

    const businessRules = (tableName:string, req: Request, res: Response, record:any={}) => 
    {
        return new Promise( (resolve, reject) => {
            switch(tableName) 
            {
                case 'AppColumn' :
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
                            newUserRecord.user_active = false;

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
                                    resolve({...newUserRecord,user_password_hash:passwordHash});
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

