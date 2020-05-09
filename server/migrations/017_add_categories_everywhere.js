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
    await knex.schema.table('requirement', (table) => {
        table.integer('requirement_category_id').nullable()
            .references('category_id')
            .inTable('category');
    })

    await knex.schema.table('resource', (table) => {
        table.integer('resource_category_id').nullable()
            .references('category_id')
            .inTable('category');
    })

    await knex.schema.table('challenge', (table) => {
        table.integer('challenge_category_id').nullable()
            .references('category_id')
            .inTable('category');
    })

    await knex.schema.table('account', (table) => {
        table.integer('account_category_id').nullable()
            .references('category_id')
            .inTable('category');
    })

    await knex.schema.table('sale', (table) => {
        table.integer('sale_category_id').nullable()
            .references('category_id')
            .inTable('category');
    })

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
        path.join(__dirname, '..', 'sql', 'schema_table_new_columns.sql')
    ).toString();
    await knex.raw(sqlMetaColumns,'[new_table_here_only]');

    /*
    // This time the custom script must come **AFTER** 
    // the AppColumn / AppTable updates above...
    // RESTORES A VIRTUAL COLUMN DELETE BY ABOVE...
    let sqlCreateVirtual_M2M_FK_fields = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 
        '016_Create_M2M_Category_to_AppTable.sql')
    ).toString();
    await knex.raw(sqlCreateVirtual_M2M_FK_fields);    
    */
};

exports.down = function(knex) {
};

