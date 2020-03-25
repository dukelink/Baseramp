import dotenv from 'dotenv'

dotenv.config();

export const development = {
    client: 'mssql',
    connection: { 
        server: process.env.MS_SQL_URI, 
        user: process.env.MS_SQL_USER, 
        password: process.env.MS_SQL_PW, 
        database: process.env.MS_SQL_DB,
        multipleStatements: true,
        encrypt: true
    },
    migrations: {
        tableName: 'knex_migrations'
    }
}

