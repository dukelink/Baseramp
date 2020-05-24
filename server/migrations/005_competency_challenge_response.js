/*
    Baseramp - A database for end users, enabling personal and private data ownership,
    built as a Progressive Web Application (PWA) using
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
    await knex.schema.createTable('competency', (table) => {
        baseFieldsBuilder(table,'competency');
        // Additional fields beyond 'base class'...        
        table.integer('competency_competency_id').nullable()
            .references('competency_id')
            .inTable('competency');
        table.text('competency_description').nullable();
        table.integer('competency_status_id').notNullable()
            .references('status_id')
            .inTable('status');        
    });

    await knex.schema.createTable('challenge', (table) => {
        baseFieldsBuilder(table,'challenge');
        // Additional fields beyond 'base class'...
        table.integer('challenge_competency_id').notNullable()
            .references('competency_id')
            .inTable('competency');
        table.text('challenge_prompt').notNullable();
        table.text('challenge_hints').nullable();
        table.text('challenge_solution').notNullable();
        table.integer('challenge_status_id').notNullable()
            .references('status_id')
            .inTable('status');        
    });

    await knex.schema.createTable('response', (table) => {
        table.increments('response_id').notNullable().primary();
        table.integer('response_challenge_id').nullable()
            .references('challenge_id')
            .inTable('challenge');
        table.text('response_answer').notNullable();
        table.timestamp('response_answer_timestamp', {useTz: true})
            .defaultTo(knex.raw('sysdatetimeoffset()'));
        table.integer('response_score_percent').notNullable();
        table.text('response_score_notes').nullable();
    });

    // Not sure how to compose a custom field in Knex Schema, so apply
    // this custom script to migration 005_competency_challenge_response.js...
    let sqlComputedColumn = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'response_title_calculated_field.sql')
    ).toString();
    await knex.raw(sqlComputedColumn);

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
    await knex.raw(sqlMetaColumns,'[competency][challenge][response]');
};

exports.down = function(knex) {
};

