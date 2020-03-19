import Knex from "knex";
import { development } from './knexfile';
const knex = Knex(development);

knex('user').select('*')
.then((data)=>{
    console.log(JSON.stringify(data));
})
