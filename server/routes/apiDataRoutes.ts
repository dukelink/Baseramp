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
import { cacheAppTables } from './cacheAppTables';
import bcrypt from "bcryptjs";
const knex = Knex(development);

type AuthenticatedRequest = Request & { user: any };

export const addApiDataRoutes = (router : Router ) => 
{
    const methods = {
        get:'get',
        put:'put',
        post:'post',
        delete:'delete'
    }

    const tables = ['category','sprint','project','story','problem','quiz','response','AppTable','AppColumn','status','user'/*,'task'*/];

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

    class apiRoute {
        path : string;
        method : string;
        queries : Array<{name:string,query:typeof knex}>;
        authProtected : boolean;
        constructor(path = '',method = '',queries : Array<{name:string,query:typeof knex}> = [], authProtected=true)
        {
            this.path = path;
            this.method = method;
            this.queries = queries;
            this.authProtected = authProtected;
        }
    }

    let getRoutes = [
        (new apiRoute('/all',methods.get,
            tables.map((tableName)=>{
            console.log(`Route 'all' includes table: ${tableName}.`)
            return ({
                name: tableName,
                query: tableSelect(tableName)
            } as any) })
        ))
    ];

    getRoutes.push(    
        (new apiRoute('/meta',methods.get,
            ['AppTable','AppColumn'].map((tableName)=>({
                name: tableName,
                query: tableSelect(tableName,true)
            } as any)), false
        ))
    )

    getRoutes.push(    
        (new apiRoute('/test',methods.get,
            tables.map((tableName)=>({
                name: tableName,
                query: tableSelect(tableName,true)
            } as any)), false
        ))
    )

    function tableSelect(tableName="",testFilter=false) 
    {
        let query = knex.select('*').from(tableName);
        const testStoryIDs = knex.select('story_id').from('story').whereIn('story_id',[210,215,217,220,225]);
        const testProjectIDs = knex.select('story_project_id').from('story').whereIn('story_id',testStoryIDs).distinct();
        const testSprintIDs = knex.select('story_sprint_id').from('story').whereIn('story_id',testStoryIDs).distinct();
        const testCategoryIDs = knex.select('project_category_id').from('project').whereIn('project_id',testProjectIDs).distinct();

        switch (tableName) {

            //
            // TODO: Metadata has been reshaped to use table names instead of surrogate keys
            //       as a likely new convention to afford the greatest simplicity to consume
            //       this data within the client application.  Consider changing the physical
            //       metadata tables to reflect this change.
            //
            case 'AppTable':
                return knex.select(
                    'AppTable_table_name as AppTable_id',
                    'AppTable_title',
                    'AppTable_description',
                    'AppTable_rank',
                    'AppTable_table_name'
                ).from('AppTable');
            case 'AppColumn':
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
                    'AppColumn_related.AppColumn_column_name as AppColumn_related_pk_id'
                ).from('AppColumn')
                    .innerJoin('AppTable','AppColumn_AppTable_id','AppTable_id')
                    .leftJoin('AppColumn as AppColumn_related','AppColumn.AppColumn_related_pk_id','AppColumn_related.AppColumn_id');
            //
            // ...TODO END
            //

            case 'user':
            {
                query = query.whereNot('user_login','like','delete-%');                
            }
            case 'story': 
            {
                if (testFilter)
                    query = query.whereIn('story_id',testStoryIDs);
                return query;
            }
            case 'project':
            {
                if (testFilter)
                    query = query.whereIn('project_id',testProjectIDs);
                return query;
            }
            case 'sprint':
            {
                if (testFilter)
                    query = query.whereIn('sprint_id',testSprintIDs);
                return query;
            }
            case 'category':
            {
                if (testFilter)
                    query = query.whereIn('category_id',testCategoryIDs);
                return query;
            }
            default:
                return query;
        }
    }

    for (let x of getRoutes) {
        const { path, queries, method, authProtected } = x;
        console.log(path);
        router[method](path, authProtected?loggedInOnly:[], async function(req,res) {
            var results = {};
            // use procedural loop and 'await' to avoid more complex Knex promise processing 
            for (let x of queries) { // STUDY: understand 'of' vs. 'in' loops
                const { name, query } = x;
                let q = query as any;
                await q.then((data)=>{
                    results[name] = data.reduce(
                        (prevVal,currVal) => {
                            prevVal[currVal[name+'_id']] = currVal;
                            return prevVal;
                        }, {});
                })
                .catch((error)=>{knexErrorHandler(req,res,error)}); 
            }
            res.send(results);
        });
    }

    // Following posts must come last for now since '/:table' matches any single token!!!  TODO: Perhaps I should modify?
    router.post("/user", (req,res) => tablePostHandler(req,res,'user') ); // allow adding new users w/o authentication
    router.post("/:table", loggedInOnly, (req,res) => tablePostHandler(req,res,req.params.table) );

    async function tablePostHandler(req:Request<any>,res:Response<any>,tableName:string) 
    {
        let record = req.body;
        if (!tableName && Object.keys(record).length) 
            res.status(400).end(); // TODOL error message handling
        else {
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
    }

    router.put("/:table/:id", loggedInOnly, 
    async function(req : AuthenticatedRequest , res) 
    {
        const tableName = req.params.table;

        if (!tableName && Object.keys(req.body).length) 
            res.status(400).end(); // TODO: error message handling
        else 
        {
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
        }
    });


    router.delete("/:table/:id", loggedInOnly, 
    async function(req : AuthenticatedRequest, res) 
    {
        const tableName = req.params.table;
        const primaryKeyField = tableName+'_id';
        const primaryKeyID = req.params.id;

        if (!tableName) 
            res.status(400).end(); // TODOL error message handling
        else if (tableName==='user') {
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
        return cacheAppTables.recall()
            .then(appTables => {
                return (
                    knex
                    .from('audit')
                    .insert({
                        audit_user_id : reqUser,
                        audit_AppTable_id : appTables[tableName],
                        audit_table_id : tableID,
                        audit_update_type : updateType,
                        audit_field_changes : JSON.stringify(recordUpdates)
                    })
            )})
    }
}

