import * as Knex from 'knex';

const baseFieldsBuilder = (table,field_root_name) => {
    table.increments(field_root_name+'_id').notNullable().primary();
    table.string(field_root_name+'_title',50).notNullable();
    table.text(field_root_name+'_description').nullable();
    table.integer(field_root_name+'_rank').nullable();
    // Status is a foreign key in all tables (except itself)
    if (field_root_name!='status')
        table.integer(field_root_name+'_status_id').notNullable()
            .references('status_id')
            .inTable('status');
}

export const schemaTables = (knex) =>
[
    knex.schema.createTable('status', (table) => {
        baseFieldsBuilder(table,'status');
    }),
    knex.schema.createTable('category', (table) => {
        baseFieldsBuilder(table,'category');
    }),
    knex.schema.createTable('project', (table) => {
        baseFieldsBuilder(table,'project');
        // Additional fields beyond 'base class'...
        table.integer('project_category_id').notNullable()
            .references('category_id')
            .inTable('category');
    }),
    knex.schema.createTable('sprint', (table) => {
        baseFieldsBuilder(table,'sprint');
        // Additional fields beyond 'base class'...
        table.date('sprint_start').notNullable();
        table.date('sprint_stop').notNullable(); 
        // todo: compute # days
    }),
    knex.schema.createTable('story', (table) => {
        baseFieldsBuilder(table,'story');
        // Additional fields beyond 'base class'...
        table.integer('story_project_id').notNullable()
            .references('project_id')
            .inTable('project');
        table.integer('story_sprint_id').notNullable()
            .references('sprint_id')
            .inTable('sprint');
        table.integer('story_points').nullable();
        table.integer('story_hours_planned').nullable();
        table.integer('story_hours_spent').nullable();
    }),
    knex.schema.createTable('task', (table) => {
        baseFieldsBuilder(table,'task');
        // Additional fields beyond 'base class'...
        table.integer('task_story_id').notNullable()
            .references('story_id')
            .inTable('story');
    })
]

export const up = async (knex) => {
    for (let createTable of schemaTables(knex))
        await createTable;
};

export const down = function(knex) {

};
