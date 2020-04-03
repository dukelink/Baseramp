import Knex from "knex";
import { development } from '../knexfile';
import { knexErrorHandler } from './util';
const knex = Knex(development);

let cache : { [tableName:string] : any } = {}; 

// REVIEW: "ES2015 Shorthand method definition" use per load() and recall() examples below...
// TODO: Properly type cache as array of promises and return value's of load and recall as promises
export const cacheTable = (tableName:string) =>
{
    return {
        load(req=undefined,res=undefined) {
            cache[tableName] = 
                knex
                    .select('*')
                    .from(tableName)
                    .then((data) => {
                        console.log(`Caching table ${tableName}`);
                        return data.reduce(
                            // Translation map from table names to ids
                            (prevVal,currVal) => {
                                if (tableName==='AppTable')
                                    prevVal[currVal['AppTable_table_name']]
                                        = currVal;
                                else
                                    prevVal[currVal[tableName+'_id']] = currVal;
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
