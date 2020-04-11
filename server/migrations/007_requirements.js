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

var fs = require('fs');
var path = require('path'); 

exports.up = async (knex) => {
    await knex.schema.createTable('requirement', (table) => {
        table.increments('requirement_id').notNullable().primary();
        table.string('requirement_identifier',12).notNullable();
        table.string('requirement_category',24).nullable();
        table.text('requirement_description').notNullable();
        table.integer('requirement_priority').nullable()

        table.integer('requirement_rank').nullable();      
        table.integer('requirement_status_id').notNullable()
            .references('status_id')
            .inTable('status');        

        table.integer('requirement_project_id').notNullable()
            .references('project_id')
            .inTable('project');
        table.integer('requirement_requirement_id').nullable()
            .references('requirement_id')
            .inTable('requirement');
    });

    // Not sure how to compose a custom field in Knex Schema, so apply
    // this custom script to compute requirement titles from ID + left(description,...)
    let sqlComputedColumn = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'requirement_title_calculated.sql')
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
    await knex.raw(sqlMetaColumns,'[requirement]');
};

exports.down = function(knex) {
};

