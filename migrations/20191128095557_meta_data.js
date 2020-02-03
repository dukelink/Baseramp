var fs = require('fs');
var path = require('path'); 

exports.up = async function(knex) {

    await knex.schema.createTable('AppTable', (table) => {
        table.increments('AppTable_id').notNullable().primary();
        table.string('AppTable_title',50).notNullable();
        table.text('AppTable_description').nullable();
        table.integer('AppTable_rank').nullable();

        table.string('AppTable_table_name',128).notNullable();
    }) 

    await knex.schema.createTable('AppColumn', (table) => {
        table.increments('AppColumn_id').notNullable().primary();
        table.string('AppColumn_title',50).notNullable();
        table.text('AppColumn_description').nullable();
        table.integer('AppColumn_rank').nullable();

        table.integer('AppColumn_AppTable_id').notNullable()            
            .references('AppTable_id')
            .inTable('AppTable');

        table.boolean('AppColumn_ui_hidden').nullable().defaultTo(false);
        table.string('AppColumn_ui_minwidth',16).nullable().defaultTo("120px");
        table.boolean('AppColumn_read_only').nullable().defaultTo(false);

        table.string('AppColumn_column_name',128).nullable();
        table.string('AppColumn_is_nullable',3).nullable();
        table.string('AppColumn_data_type',128).nullable();
        table.integer('AppColumn_character_maximum_length').nullable();
        table.string('AppColumn_column_default',4000).nullable();

        table.integer('AppColumn_related_pk_id').nullable()
            .references('AppColumn_id')
            .inTable('AppColumn');
    }) 

    await knex.schema.createTable('table_metadata', (table) => {
        table.increments('table_metadata_id').notNullable().primary();
        table.string('table_metadata_title',50).notNullable();
        table.text('table_metadata_description').nullable();
        table.integer('table_metadata_rank').nullable();

        table.integer('table_metadata_table_name').nullable();
    }) 

    await knex.schema.createTable('column_metadata', (table) => {
        table.increments('column_metadata_id').notNullable().primary();
        table.string('column_metadata_title',50).nullable();
        table.text('column_metadata_description').nullable();
        table.integer('column_metadata_rank').nullable();

        table.string('column_metadata_general_column_name',50).nullable();
        table.string('column_metadata_table_name',50).nullable();

        table.boolean('column_metadata_ui_hidden').nullable();
        table.string('column_metadata_ui_minwidth',16).nullable();
        table.boolean('column_metadata_read_only').nullable();
    }) 

    // Fixed and seed records...
    await knex.insert([
        // UI documentation & formatting metadata...
        
        {   column_metadata_general_column_name: '_id', 
            column_metadata_ui_hidden: true,
            column_metadata_read_only: true },

        {   column_metadata_general_column_name: '_title', 
            column_metadata_ui_minwidth: '100%', 
            column_metadata_rank: 20 },
        {   column_metadata_general_column_name: '_rank', 
            column_metadata_rank: 30 },
        {   column_metadata_general_column_name: '_status_id', 
            column_metadata_rank: 40 },
        {   column_metadata_title: 'Description', 
            column_metadata_general_column_name: '_description',
            column_metadata_ui_minwidth: '100%', 
            column_metadata_rank: 500 },

        {   column_metadata_general_column_name: '_AppTable_id', 
            column_metadata_read_only: true },
        {   column_metadata_general_column_name: '_column_name', 
            column_metadata_read_only: true },
        {   column_metadata_general_column_name: '_is_nullable', 
            column_metadata_read_only: true },
        {   column_metadata_general_column_name: '_data_type', 
            column_metadata_read_only: true },
        {   column_metadata_general_column_name: '_character_maximum_length', 
            column_metadata_read_only: true },
        {   column_metadata_general_column_name: '_column_default', 
            column_metadata_read_only: true },
        {   column_metadata_general_column_name: '_table_name', 
            column_metadata_read_only: true }
    ]).into('column_metadata');

    let sqlMetaFKs = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'schema_foreign_keys.sql')
    ).toString();
    await knex.raw(sqlMetaFKs);

    let sqlMetaColumns = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'schema_table_columns.sql')
    ).toString();
    await knex.raw(sqlMetaColumns);
};

exports.down = function(knex) {
  
};
