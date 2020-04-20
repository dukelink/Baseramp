import Knex from "knex";
import { Request, Response } from 'express';
import { development } from '../knexfile';
import { knexErrorHandler } from './util';
const knex = Knex(development);

let cache : { [tableName:string] : Promise<void | Knex> } = {}; 

// Note: Using ES2015 Shorthand method definition" 
// for load() and recall()...
export const cacheTable = (tableName:string) =>
{
  return {
    load(req:Request, res: Response) {
      cache[tableName] = 
        knex
          .select('*')
          .from(tableName)
          .then( async (data) => {
            console.log(`Caching table ${tableName}...`);
            return data.reduce(
              // Translation map from table names to ids
              (prevVal,currVal) => {
                switch (tableName) {
                  case 'AppTable': // Store by table name
                    prevVal[currVal['AppTable_table_name']] = currVal;
                    break;
                  case 'AppColumn': // Store by column name
                    prevVal[currVal['AppColumn_column_name']] = currVal;
                    break;
                  default:
                    prevVal[currVal[tableName+'_id']] = currVal;
                    break;
                }
                return prevVal;
              }, {}) }
          );
      if (req)
        cache[tableName] = cache[tableName]
          .catch((err)=>knexErrorHandler(req,res,err));
      return cache;
    },
    recall() {
      // Note: OK for recall() to throw error if load() never called
      return cache[tableName];
    }
  } 
}
