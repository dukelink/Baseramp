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
    await knex.schema.createTable('StoryRequirement', (table) => {
        //
        // Naming conventions are important:
        //
        // 1. Table name (above) and 1st FK prefix are concatenated table names...
        table.integer('StoryRequirement_id').nullable()
            .references('story_id')
            .inTable('story');
        // 2. 2nd FK is just name of table plus "_id"...
        table.integer('StoryRequirement_requirement_id').nullable()
            .references('requirement_id')
            .inTable('requirement');
    });

    // Naming conventions follow pattern above
    // cyclic many-to-many relationships too...
    await knex.schema.createTable('StoryStory', (table) => {
        table.integer('StoryStory_id').nullable()
            .references('story_id')
            .inTable('story');
        table.integer('StoryStory_story_id').nullable()
            .references('story_id')
            .inTable('story');
    });

    await knex.schema.table('AppColumn', (table) => {
        table.integer('AppColumn_AppTable_junction_id').nullable()            
            .references('AppTable_id')
            .inTable('AppTable');
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
        path.join(__dirname, '..', 'sql', 'schema_table_columns.sql')
    ).toString();
    await knex.raw(sqlMetaColumns,'[StoryRequirement][StoryStory]');


    // This time the custom script must come **AFTER** 
    // the AppColumn / AppTable updates above...
    let sqlCreateVirtual_M2M_FK_fields = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 
        '014_Create_Many2Many_Story_AppColumns.sql')
    ).toString();
    await knex.raw(sqlCreateVirtual_M2M_FK_fields);
};

exports.down = function(knex) {
};

