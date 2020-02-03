const express = require('express');
const router = express.Router();
const Knex = require("knex");
const development = require('../knexfile');
const { knexErrorHandler } = require('./util');
const knex = Knex(development);

const methods = {
    get:'get',
    put:'put',
    post:'post',
    delete:'delete'
}

const tables = ['category','sprint','project','story','AppTable','AppColumn','status','user'];

class apiRoute {
    constructor(path = '',method = '',queries = [])
    {
        this.path = path;
        this.method = method;
        this.queries = queries;
    }
}

let getRoutes = [
    (new apiRoute('/all',methods.get,
        tables.map((tableName)=>({
            name: tableName,
            query: tableSelect(tableName)
        }))
    ))
];

getRoutes.push(    
    (new apiRoute('/test',methods.get,
        tables.map((tableName)=>({
            name: tableName,
            query: tableSelect(tableName,true)
        }))
    ))
)

function tableSelect(tableName="",testFilter=false) 
{
    let query = knex.select('*').from(tableName)
    const testStoryIDs = knex.select('story_id').from('story').whereIn('story_id',[210,215,217,220,225]);
    const testProjectIDs = knex.select('story_project_id').from('story').whereIn('story_id',testStoryIDs).distinct();
    const testSprintIDs = knex.select('story_sprint_id').from('story').whereIn('story_id',testStoryIDs).distinct();
    const testCategoryIDs = knex.select('project_category_id').from('project').whereIn('project_id',testProjectIDs).distinct();

    switch (tableName) {

        //
        // TODO: Metadata has been reshaped to use table names instead of surrogate keys
        //       as a likely new convention to afford the greatest simplicity to consome
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
    const { path, queries, method } = x;
    console.log(path);
    router[method](path, async function(req,res) {
        var results = {};
        // use procedural loop and 'await' to avoid more complex promise processing 
        for (let x of queries) { // study: understand 'of' vs 'in' loops
            const { name, query } = x;
            let q = query;
            await q.then((data)=>{

                //results[name] = data;
                //if (name==='status') 
                {
                    results[name] = data.reduce(
                        (prevVal,currVal) => {
                            prevVal[currVal[name+'_id']] = currVal;
                            return prevVal;
                        }, {});
                }

            })
            .catch((error)=>{knexErrorHandler(req,res,error)}); 
        }
        res.send(results);
    });
}

router.put("/:table/:id", function(req , res) {
    const field_prefix = req.params.table;
    if (!field_prefix && Object.keys(req.body).length) 
        res.status(400).end(); // TODOL error message handling
    else {
        const primaryKeyField = field_prefix+'_id';
        if (/^\d+$/.test(req.params.id)) {
            knex(req.params.table)
                .where(primaryKeyField,'=',req.params.id)
                .update(req.body) // TODO: validate against dd and handle nulls, etc.
                .then((data)=>{
                    res.status(200).end();
                })
                .catch((error)=>{knexErrorHandler(req,res,error)}); 
        } else {
            knex(req.params.table)
                .where(
                    { 'AppTable': 'AppTable_table_name', 'AppColumn': 'AppColumn_column_name' }[req.params.table],
                    '=',
                    req.params.id)
                .update(req.body) // TODO: validate against dd and handle nulls, etc.
                .then((data)=>{
                    res.status(200).end();
                })
                .catch((error)=>{knexErrorHandler(req,res,error)}); 
        }  
    }
});

router.post("/:table", function(req , res) {
    const field_prefix = req.params.table;
    if (!field_prefix && Object.keys(req.body).length) 
        res.status(400).end(); // TODOL error message handling
    else {
        const primaryKeyField = field_prefix+'_id';
        knex(req.params.table)
            .insert(req.body, [primaryKeyField]) // TODO: validate against dd and handle nulls, etc.
            .then((data)=>{
                console.log(data);
                // NOTE: Currently I relfect the added record just in case there are any computed fields...
                knex(req.params.table)
                    .select('*')
                    .where(primaryKeyField,'=',
                        data[0]/*[primaryKeyField]*/) // Note: Postgresql needed "[primaryKeyField]" but not MS SQL???
                    .then((data)=>{
                        res.send(data);
                    })
                    // TODO: Can/should we differentiate (for client) between an error here and on the insert itself???
                    .catch((error)=>{knexErrorHandler(req,res,error)}); 
            })
            .catch((error)=>{knexErrorHandler(req,res,error)});
    }
});

router.delete("/:table/:id", function(req , res) {
    const field_prefix = req.params.table;
    if (!field_prefix && Object.keys(req.body).length) 
        res.status(400).end(); // TODOL error message handling
    else {
        const primaryKeyField = field_prefix+'_id';
        knex(req.params.table)
            .where(primaryKeyField,'=',req.params.id)
            .delete() // TODO: validate against dd and handle nulls, etc.
            .then((data)=>{
                res.status(200).end();
            })
            .catch((error)=>{knexErrorHandler(req,res,error)}); 
    }
});

module.exports = router;
