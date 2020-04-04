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

type AuthenticatedRequest = Request & { user: any };

export const addApiReadDataRoutes = (router : Router ) => 
{
    const tables = [
        'category','sprint','project','story',
        'problem','quiz','response','AppTable',
        'AppColumn','status','user', 'role'/*,'task'*/];

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
        constructor(path = '',method = '',queries : Array<{name:string,query:QueryBuilder}> = [], authProtected=true)
        {
            this.path = path;
            this.method = method;
            this.queries = queries;
            this.authProtected = authProtected;
        }
    }

    let getRoutes = [
        (new apiRoute('/all','get',
            tables.map((tableName)=>{
            console.log(`Route 'all' includes table: ${tableName}.`)
            return ({
                name: tableName,
                query: tableSelect(tableName)
            } as any) })
        ))
    ];

    getRoutes.push(    
        (new apiRoute('/meta','get',
            ['AppTable','AppColumn'].map((tableName)=>({
                name: tableName,
                query: tableSelect(tableName,true)
            } as any)), false
        ))
    )

    getRoutes.push(    
        (new apiRoute('/test','get',
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
        router[method](path, authProtected?loggedInOnly:[], async function(req,res) 
        {
            let results = {};
            let promises : Array<QueryBuilder> = [];
            // use procedural loop and 'await' to avoid more complex Knex promise processing 
            for (let x of queries) { // STUDY: understand 'of' vs. 'in' loops
                const { name, query } = x;

                const user_id = (req.user as any).user_id;
                console.log(`path=${path}, name=${name}, user=${user_id}`);

                await query.then((data)=>{
                    results[name] = data.reduce(
                        (prevVal,currVal) => {
                            //console.log('***'+name)
                            prevVal[currVal[name+'_id']] = currVal;
                            return prevVal;
                        }, {});
                })
                .catch((error)=>{knexErrorHandler(req,res,error)}); 
            }
            res.send(results);
        });
    }
}
