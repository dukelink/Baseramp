/*
    Baseramp - An end user database system, 
    enabling personal data usage and private data ownership,
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
    await knex.schema.createTable('account', (table) => {
        baseFieldsBuilder(table,'account');
        // Additional fields beyond 'base class'...        
        table.integer('account_account_id').nullable()
            .references('account_id')
            .inTable('account');
        table.text('account_description').nullable();
        table.string('account_url',80).nullable();
        table.string('account_email_used',40).nullable();
        table.string('account_login',40).nullable();
        table.string('account_cell_used',40).nullable();
        table.date('account_start_date').nullable();
        table.date('account_next_review_date').nullable();
        table.integer('account_status_id').nullable()
            .references('status_id')
            .inTable('status');        
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
    await knex.raw(sqlMetaColumns,'[account]');
};

exports.down = function(knex) {
};

