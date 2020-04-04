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

import { Router, Request } from 'express';
import Knex, { QueryBuilder } from "knex";
import { development } from '../knexfile';
import { knexErrorHandler } from './util';
const knex = Knex(development);

const userTables = [
    'category',
    'sprint',
    'story',
    //,'task'
    'project',
    'problem',
    'quiz',
    'response'
];

const adminTables = [
    'AppTable',
    'AppColumn',
    'status',
    'user', 
    'role'
];

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
    queries : Array<{name:string,query:QueryBuilder}>;
    authProtected : boolean;
    constructor(
        path : string,
        method : string,
        queries : Array<{name:string,query:QueryBuilder}>, 
        authProtected : boolean = true)
    {
        this.path = path;
        this.method = method;
        this.queries = queries;
        this.authProtected = authProtected;
    }
}

let getRoutes = [
    ( new apiRoute('/all', 'get',
        [ ...userTables, ...adminTables ]
            .map( (tableName) => {
                return {
                    name: tableName,
                    query: tableSelect(tableName)
                } } )
    ) ) ];

getRoutes.push(    
    (new apiRoute('/meta','get',
        ['AppTable','AppColumn']
            .map( (tableName) => {
                return {
                    name: tableName,
                    query: tableSelect(tableName)
                }}), false
    ))
)

function tableSelect(tableName : string) 
{
    let query = knex.select('*').from(tableName);

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
                'AppTable_table_name',
                "role.role_title"
            ).from('AppTable')
            .leftJoin('role','AppTable_role_id','role_id');
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
        default:
            return query;
    }
}

export const addApiReadDataRoutes = async (router : Router ) => 
{    
    for (let x of getRoutes) {
        const { path, queries, method, authProtected } = x;
        console.log(path);
        router[method](path, authProtected?loggedInOnly:[], async function(req,res) 
        {
            let results = {};

//            const user_id = req?.paras?.table;

            // Use procedural loop and 'await' to confirm potential performance
            // benefit is worth the additional work for parallel processing...
            for (let x of queries) { 
                const { name: tableName, query } = x; 
                

                const user_id = (req.user as any)?.user_id;



                // User tables filter rows by user 'ownership'
                if (userTables.includes(tableName)) {

const query2 =  knex.select('*').from(tableName);

                            console.log(`PATH ${path}, user_id ${/*req?.user?.user_id*/user_id}`)

                            const ownedRows = 
                            knex.select('audit_table_id')
                                .from('audit')
                                .innerJoin('AppTable','audit_AppTable_id','AppTable_id')
                                .where('AppTable_title','=',tableName)
                                .where('audit_user_id','=',/*req?.user?.user_id*/user_id);
        

                    console.log(`NOT ADMIN - filtered, tableName=${tableName}, user_id=${user_id}`)
                    await query2
                        .whereIn(tableName+'_id',ownedRows)
                        .then( (data) => {
                            console.log(`${tableName} rows read = ${data.length}`)
                            results[tableName] = data.reduce(
                                (prevVal,currVal) => {
                                    prevVal[currVal[tableName+'_id']] = currVal;
                                    return prevVal;
                                }, {});
                        })
                        .catch((error)=>{knexErrorHandler(req,res,error)});                             
                } else {
                    console.log(`ADMIN - NOT filtered, tableName=${tableName}`)

//
// TODO: Refactory to build all queries locally; Move special Meta table refactor here...
//

                    await query
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
            res.send(results);
        });
    }
}
