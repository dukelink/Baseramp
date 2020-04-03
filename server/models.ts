import bcrypt from "bcryptjs";
import Knex from "knex";
import { development } from './knexfile';
const knex = Knex(development);
import { knexErrorHandler } from './routes/util';

export const User = {
  findByUsername : username => {
    const prom = new Promise((resolve,reject)=>{
      knex('user').select('user.*','role.role_title')
      .leftJoin('role','user_role_id','role_id')
      .where('user_login','=',username)
      .then((data)=>{
        // console.log(`USER DATA BY NAME: ${JSON.stringify(data)}`)
        if (data.length) {
          const user_id = data[0].user_id.toString();
          const user_obj = {...data[0], user_id};
          resolve(user_obj);  
        } else
          reject("Invalid user name");
      })
//     .catch((error)=>{knexErrorHandler(req,res,error)}); // TODO: reject()
    })
    return prom;
  }, 

  findById : (userId, cb) => {
    knex('user').select('user.*','role.role_title')
    .leftJoin('role','user_role_id','role_id')
    .where('user_id','=',userId)
    .then((data)=>{
      // console.log(`USER DATA BY ID: ${JSON.stringify(data)}`)
      if (data.length) {
        const user_id = data[0].user_id.toString();
        const user_obj = { [user_id] : {...data[0], user_id } };
        cb(null,user_obj[user_id]);     
      } else
        cb("user ID not found",null);
    })
//    .catch((error)=>{knexErrorHandler(req,res,error)}); // TODO: cb() error
  },

  validPassword : (user,password) => {
    return bcrypt.compareSync(password, user.user_password_hash)
      && user.user_active // TODO: would we want a distinct message for this case?
  }

} 

