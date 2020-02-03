var fs = require('fs');
var path = require('path'); 

exports.up = async (knex) => {
    await knex.schema.createTable('user', (table) => {
        table.increments('user_id').notNullable().primary();
        table.string('user_title',80).notNullable().unique();
        table.string('user_login',80).notNullable().unique();
        table.string('user_password_hash',100).notNullable();
        table.boolean('user_active').notNullable().defaultTo(false);
        table.string('user_email',80).nullable();
        table.string('user_phone',30).nullable();
    })

    await knex.schema.createTable('audit', (table) => {
        table.integer('audit_user_id',80).notNullable()
            .references('user_id')
            .inTable('user');
        table.integer('audit_AppTable_id',80).notNullable()
            .references('AppTable_id')
            .inTable('AppTable');
        table.integer('audit_table_id').notNullable();
        table.string('audit_update_type', 6).notNullable();
        table.timestamp('audit_update_time', {useTz: true});
        table.json('audit_field_changes').nullable();
    }) 

    let sqlMetaFKs = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'schema_foreign_keys.sql')
    ).toString();
    await knex.raw(sqlMetaFKs);

    let sqlMetaColumns = fs.readFileSync(
        path.join(__dirname, '..', 'sql', 'schema_table_columns.sql')
    ).toString();
    await knex.raw(sqlMetaColumns,'[user]|[audit]');
};

exports.down = function(knex) {
    // TODO: Failed, can debug another day....
    //knex.schema.dropTable('audit');
    //knex.schema.dropTable('user');
};

