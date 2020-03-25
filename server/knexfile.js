"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.development = {
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
};
//# sourceMappingURL=knexfile.js.map