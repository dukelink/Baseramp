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
    table.integer(field_root_name+'_rank').nullable();
}

exports.up = async (knex) => {
    await knex.schema.createTable('role', (table) => {
        baseFieldsBuilder(table,'role');
        // Additional fields beyond 'base class'...        
        table.text('role_description').nullable();
        table.integer('role_status_id').notNullable()
            .references('status_id')
            .inTable('status');
    });

    // Fixed and seed records...
    await knex.insert([
        {   role_title: 'Admin', 
            role_status_id: 2 },
        {   role_title: 'User', 
            role_status_id: 2 },
    ]).into('role');

    await knex.schema.table('user', (table) => {
        table.integer('user_role_id').nullable()
            .references('role_id')
            .inTable('role');
    });

    await knex.schema.table('AppTable', (table) => {
        table.integer('AppTable_role_id').nullable()
            .references('role_id')
            .inTable('role');
    });

    let sqlTableRoles = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'initialize_table_roles.sql')
    ).toString();
    await knex.raw(sqlTableRoles);    

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
    await knex.raw(sqlMetaColumns,'[role][user][AppTable]');
};

exports.down = function(knex) {
};

