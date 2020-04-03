import createError from 'http-errors';
import express from 'express';
import path from 'path';
// var logger = require('morgan'); // Handled by Azure at present
import { apiRoutes } from './routes/apiRoutes';
// var cors = require('cors');  
import passport from 'passport';
import expressStaticGzip from "express-static-gzip";
import { User } from "./models";
import expressSession from "express-session";
import dotenv from 'dotenv'

dotenv.config();

export var app = express();

console.log(`Environment: 
  MS_SQL_URI = ${process.env.MS_SQL_URI}
  MS_SQL_USER = ${process.env.MS_SQL_USER}
  MS_SQL_PW = ${process.env.MS_SQL_PW}
  MS_SQL_DB = ${process.env.MS_SQL_DB}
`);

// Session setup
app.use(
  expressSession({ 
    resave: false,
    saveUninitialized: true,
    secret:
      process.env.SESSION_SEC || "You must generate a random session secret"
  })
);
app.use(passport.initialize()); // must follow use of expressSession!
app.use(passport.session());    // also required

passport.serializeUser(function(user:any, done) {
// TDD:  console.log(`passport.serializeUser() user=\n${JSON.stringify(user)}\n\n`);
  done(null, user.user_id); // Just need a unique ID here; stored in Session
});

passport.deserializeUser(function(userId, done) {
  User.findById(userId, (err, user) => {
// TDD:    console.log(`passport.deserializeUser() User.findById() callback; user=\n${JSON.stringify(user)}\nError=${err}\n\n`);
    done(err, { 
      // Put whatever we want available to routes in 'req' object
      // RESEARCH: Research security of role id info...
      user_id: user.user_id, 
      user_role_id: user.user_role_id, 
      role_title: user.role_title,
      username: user.user_login 
    } ); 
  });
});

// Passport Local
const LocalStrategy = require("passport-local").Strategy;
const local = new LocalStrategy((username, password, done) => {
  User.findByUsername(username)
    .then(user => {
      /*
      console.log(`
        passport use LocalStrategy: User.findByUsername() callback; 
        user==:\n${JSON.stringify(user)}\n
        and, User.validPassword(user,password)("${password}")=${User.validPassword(user,password)}\n`);
      */
      if (!user || !User.validPassword(user,password)) {
        done(null, false, { message: "Invalid username/password" });  // TODO: Surface these messages; and differentiate 'inactive' account message
      } else {
        done(null, user);
      }
    })
    .catch(e => {
      console.log(`app.js line 84: ${e}`)
      return done(null,false,e)
    });
});
passport.use("local", local);

//app.options('*', cors()); // needed during dev on port 3000 after login to server on port 8080
//app.use(logger('dev'));

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

// Both of following work, use first if gzipping for production!
// Note: Should match test in environment.ts
if (process.env.COMPUTERNAME==='BASERAMP') // TODO: Dup of code below; change to setting????
  app.use(express.static(path.join(__dirname, 'build')));
else
  app.use(expressStaticGzip(path.join(__dirname, 'build'),{}));


//CORS Middleware
app.use(function (req, res, next) {
  //Enabling CORS 
  //res.header("Access-Control-Allow-Origin", "*");
  // TODO: Should we pare down the following two header parameters...
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, authorization, X-Auth-Token, X-Accept-Charset,X-Accept");  
  next();
});

app.use('/api', 
  // cors no longer required for local dev now that we use package.json 
  // to proxy express (:8080) on (:3000)... :)
  //  cors({origin: '*'}),     
  apiRoutes );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler: working to reflect auth & SQL errors to client,
// which is a start for constructively informing the user/developer...
app.use(function(err, req, res, next) { // TODO: Check this out, err parameter looks fishy
  // set locals, only providing error in development
  // TODO: Review???
  res.locals.message = err.message;
  // OK to pass through, these messages are already useful to users/devs;
  // can translate to even more friendly later...
  res.locals.error = err // req.app.get('env') === 'development' ? err : {};
  
  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

