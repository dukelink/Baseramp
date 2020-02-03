const Knex = require("knex");
const development = require('../knexfile');
const knex = Knex(development);

module.exports.knexErrorHandler = (req, res, error) => {
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

exports.findByUsername = async function(username, cb) {
//  process.nextTick(function() { // RESEARCH IF NEEDED/USERFUL
  await knex('user')
  .select('*')
  .then((data)=>{
    data.forEach((record)=>{
      if (record.user_login === username)
        return cb(null, record);
    }
  )})
  .catch((error)=>{ 
    // TODO: Add error handing
    return cb(null, null);
  }); 
//  }); 
}
