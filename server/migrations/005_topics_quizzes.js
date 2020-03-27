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

var fs = require('fs');
var path = require('path'); 

const baseFieldsBuilder = (table,field_root_name) => {
    table.increments(field_root_name+'_id').notNullable().primary();
    table.string(field_root_name+'_title',50).notNullable();
    table.integer(field_root_name+'_rank').nullable();
}

exports.up = async (knex) => {
    await knex.schema.createTable('quiz', (table) => {
        baseFieldsBuilder(table,'quiz');
        // Additional fields beyond 'base class'...        
        table.integer('quiz_quiz_id').nullable()
            .references('quiz_id')
            .inTable('quiz');
        table.text('quiz_description').nullable();
        table.integer('quiz_status_id').notNullable()
            .references('status_id')
            .inTable('status');        
    });

    await knex.schema.createTable('problem', (table) => {
        baseFieldsBuilder(table,'problem');
        // Additional fields beyond 'base class'...
        table.integer('problem_quiz_id').notNullable()
            .references('quiz_id')
            .inTable('quiz');
        table.text('problem_prompt').notNullable();
        table.text('problem_hints').nullable();
        table.text('problem_solution').notNullable();
        table.integer('problem_status_id').notNullable()
            .references('status_id')
            .inTable('status');        
    });

    await knex.schema.createTable('response', (table) => {
        table.increments('response_id').notNullable().primary();
        table.integer('response_problem_id').nullable()
            .references('problem_id')
            .inTable('problem');
        table.text('response_answer').notNullable();
        table.timestamp('response_answer_timestamp', {useTz: true})
            .defaultTo(knex.raw('sysdatetimeoffset()'));
        table.integer('response_score_percent').notNullable();
        table.text('response_score_notes').nullable();
    });

    // Drop and recreate all foreign key relationship metadata.
    // Nothing here is user-configurable, so no settings are lost.
    let sqlMetaFKs = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'schema_foreign_keys.sql')
    ).toString();
    await knex.raw(sqlMetaFKs);

    // Drop and recreate column metadata only for tables that have
    // been modified (see [...] filters below).  Minor user settings
    // covering UI style will need to be refreshed for the modified
    // table(s)...
    let sqlMetaColumns = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'schema_table_columns.sql')
    ).toString();
    await knex.raw(sqlMetaColumns,'[quiz][problem][response]');
};

exports.down = function(knex) {
};

