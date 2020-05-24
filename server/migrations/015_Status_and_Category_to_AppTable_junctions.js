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

exports.up = async (knex) => {
    await knex.schema.createTable('StatusAppTable', (table) => {
        //
        // Naming conventions are important:
        //
        // 1. Table name (above) and 1st FK prefix are concatenated table names...
        table.integer('StatusAppTable_id').nullable()
            .references('status_id')
            .inTable('status');
        // 2. 2nd FK is just name of table plus "_id"...
        table.integer('StatusAppTable_AppTable_id').nullable()
            .references('AppTable_id')
            .inTable('AppTable');            
    });

    await knex.schema.createTable('CategoryAppTable', (table) => {
        //
        // Naming conventions are important:
        //
        // 1. Table name (above) and 1st FK prefix are concatenated table names...
        table.integer('CategoryAppTable_id').nullable()
            .references('category_id')
            .inTable('category');
        // 2. 2nd FK is just name of table plus "_id"...
        table.integer('CategoryAppTable_AppTable_id').nullable()
            .references('AppTable_id')
            .inTable('AppTable');            
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
    await knex.raw(sqlMetaColumns,'[StatusAppTable][CategoryAppTable]');

    // This time the custom script must come **AFTER** 
    // the AppColumn / AppTable updates above...
    let sqlCreateVirtual_M2M_FK_fields = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 
        '015_Create_M2M_Status_Category_to_AppTable.sql')
    ).toString();
    await knex.raw(sqlCreateVirtual_M2M_FK_fields);
};

exports.down = function(knex) {
};

