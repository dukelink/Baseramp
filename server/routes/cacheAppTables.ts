import Knex from "knex";
import { development } from '../knexfile';
import { knexErrorHandler } from './util';
const knex = Knex(development);

// REVIEW: "ES2015 Shorthand method definition" use per load() and recall() examples below...
export const cacheAppTables = 
{
    cache : undefined as any, // OK for recall() to error out if load() never called

    load(req=undefined,res=undefined) {
        this.cache = 
            knex
                .select('AppTable_id','AppTable_table_name')
                .from('AppTable')
                .then((data) => data.reduce(
                    // Translation map from table names to ids
                    (prevVal,currVal) => {
                        prevVal[currVal['AppTable_table_name']] = currVal.AppTable_id;
                        return prevVal;
                    }, {})
                );
        if (req)
            this.cache = this.cache
                .catch((err)=>knexErrorHandler(req,res,err));
        return this.cache;
    },

    recall() {
        return this.cache || this.load();
    }
}
