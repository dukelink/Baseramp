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

import { Request, Response } from 'express';
import Knex from "knex";
import bcrypt from "bcryptjs";

import { knexErrorHandler } from './util';
import { development } from '../knexfile';
import { cacheMetadata } from './apiReadDataRoutes';

const knex = Knex(development);

export const businessRules 
= (tableName:string, req: Request, res: Response, record:any={}) => 
{
  let promise: Promise<{ record:object, virtual:Array<{[key:string]:any}> }>;
  promise = new Promise( (resolve, reject) => {
    switch(tableName) 
    {
      /*
      case 'AppColumn' :
        // HACK: Translate PK's back from column name to ID...
        knex
          .select('AppColumn_id')
          .from('AppColumn')
          .where('AppColumn_column_name','=',req.params.id)
          // then() must come before catch() since we don't rethrow exception in knexErrorHandler
          .then( data => {
            const newRec = {...record, ...data[0]};
            resolve({record:newRec,virtual:[]});
          } )
          .catch( (error) => { knexErrorHandler(req,res,error) } );
        break;
      */

      case 'user':
        if (record.user_password_hash) 
        {
          let newUserRecord = {...record};

          // hack: relies on current circumstance that
          // new user routes do not include :table parameter.
          // An assumption likely to hold, but a hack nonetheless...
          if (tableName !== req.params.table)
            // New user registration should not immediately grant access.
            // Access will need to be approved by an existing.
            // We can relax this once multi-tenancy is fully implemented...
            newUserRecord.user_active = true // false; -- allow immediate new user signin for now (TODO 2 factory)

          bcrypt.hash(
            record.user_password_hash,
            // TODO:
            // re 3: 12 or higher is suggested for better encryption strength
            // in production.  Also consider, adding 'pepper' or other hashing
            // schemes.  High salting rounds increase CPU times and can create
            // noticeable delays for user authentication but that is the
            // source of the encryption strength.  Here's a discussion about adding 'pepper':
            // https://security.stackexchange.com/questions/3272/password-hashing-add-salt-pepper-or-is-salt-enough?noredirect=1&lq=1
            // Another option may be SHA-512:
            // https://crypto.stackexchange.com/questions/46550/benchmark-differences-between-sha-512-and-bcrypt
            3, 
            (err,passwordHash) => {
              if (err) 
                reject(err);
              else
                resolve({ record: {
                    ...newUserRecord,
                    user_password_hash:passwordHash,
                    // Default new users to 'User' role...
                    // TODO: Remove hard code for role_id...
                    user_role_id: record.user_role_id || 2
                  }, 
                  virtual:[]
                });
            })
        } else
          resolve({record,virtual:[]});
        break;

      default:
        //
        // Separate out any many-to-many, virtual fields...
        //
        const { AppColumn } = cacheMetadata;
        let newRecord = {}, virtualFields : Array<object> = [];

        Object.entries(record as object)
        .forEach( ([key,value]) => {
          // Is this a virtual field associated with a junction table?
          const junction_table_id = AppColumn[key]['AppColumn_AppTable_junction_id'];
          if (junction_table_id) {
            if (value.length)
              (value as Array<number>).forEach(fkID => {
                virtualFields.push({
                  table : AppColumn[key]['AppColumn_AppTable_junction_id'],
                  key,
                  fkField: AppColumn[key]['AppColumn_related_pk_id'],
                  fkID
                });
              });
            else
              // If virtual fields were changed we must have at least
              // on entry to trigger deletion of dereferenced items
              // even if no referenced items remain, so just push a null FK...
              virtualFields.push({
                table : AppColumn[key]['AppColumn_AppTable_junction_id'],
                key,
                fkField: AppColumn[key]['AppColumn_related_pk_id'],
                fkID: undefined                
              })
            Object.assign( virtualFields, { [key] : value } );
          } else
            Object.assign( newRecord, { [key] : value } );
        });
        resolve({record:newRecord,virtual:virtualFields});
    }
  });
  return promise;
}
