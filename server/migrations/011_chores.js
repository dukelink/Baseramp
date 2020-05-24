/*
    Baseramp - A database for end users enabling personal and private data ownership,
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
    table.text(field_root_name+'_description').nullable();
    table.integer(field_root_name+'_rank').nullable();
    // Status is a foreign key in all tables (except itself)
    if (field_root_name!='status')
        table.integer(field_root_name+'_status_id').notNullable()
            .references('status_id')
            .inTable('status');
}

exports.up = async (knex) => {

    await knex.schema.createTable('chore', (table) => {
        baseFieldsBuilder(table,'chore');
        // Additional fields beyond 'base class'...
        table.integer('chore_category_id').notNullable()
            .references('category_id')
            .inTable('category');
        table.integer('chore_points').nullable();
        table.integer('chore_hours_planned').nullable();
    });

    await knex.schema.createTable('checkoff', (table) => {
        table.increments('checkoff_id').notNullable().primary();
        table.integer('checkoff_chore_id').nullable()
            .references('chore_id')
            .inTable('chore');
        table.text('checkoff_notes').nullable();
        table.timestamp('checkoff_completed_timestamp', {useTz: true})
            .defaultTo(knex.raw('sysdatetimeoffset()'));
        table.integer('checkoff_hours_spent').nullable();
    });

    // Not sure how to compose a custom field in Knex Schema, so apply
    // this custom script...
    let sqlComputedColumn = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'checkoff_title_calculated_field.sql')
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
    await knex.raw(sqlMetaColumns,'[chore][checkoff]');
};

exports.down = function(knex) {
};

