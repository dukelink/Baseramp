/*
    Baseramp - A database for end users, enabling personal and private data ownership,
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

import Knex from "knex";
import { development } from '../knexfile';
const knex = Knex(development);

export const knexErrorHandler = (req, res, error) => {
    // TODO: We could wrap the 'knex' method to 
    // include our catch handler too, as we did 
    // with Fetch on the client side!    
    //
    // TODO: Reference point for further research:
    // https://stackoverflow.com/questions/14154337/how-to-send-a-custom-http-status-message-in-node-express
    //
    
    console.error('\nSQL (knex call) error:');;
    console.error(error); 
    console.error('\n');
    
    let httpResponseCode = 400; // Default error response
    // TODO: customize http response code?
    let errorMessage = !error.originalError 
        ? error 
        : (
            !error.originalError.info 
            ? error.originalError
/* e.g., sample case:
Cannot open server 'lotherington' requested 
by the login. Client with IP address '172.58.27.122' is not allowed to access the server.  
To enable access, use the Windows Azure Management Portal or run sp_set_firewall_rule 
on the master database to create a firewall rule for this IP address or address range.  
It may take up to five minutes for this change to take effect.
*/
            : error.originalError.info.message
        ); 

    switch (req.method) {
        case 'DELETE' : 
            if (errorMessage.includes('conflicted with the REFERENCE constraint'))
                httpResponseCode = 409;
    }
    res.statusMessage = errorMessage;
    res.status(httpResponseCode).end();
}

export const findByUsername = function(username, cb) {
//  process.nextTick(function() {... // RESEARCH IF NEEDED/USEFUL
  knex
  .from('user')
  .select('*')
  .then((data)=>{
    data.forEach((record)=>{
      if (record.user_login.toLowerCase() === username.toLowerCase())
        return cb(null, record);
      else
        return cb(null,null); // responds correctly with 'unauthorized'
    }
  )})
  .catch((error)=>{ 
    // TODO: Add error handing
    return cb(null, null);
  }); 
// ...}); 
}
