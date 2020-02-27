var createError = require('http-errors');
var express = require('express');
var path = require('path');
//var logger = require('morgan'); // TODO ???
var apiRouter = require('./routes/apiRoutes');
var app = express();
var cors = require('cors');  
var passport = require('passport');

const expressStaticGzip = require("express-static-gzip");
const User = require("./models");

// Session setup
const expressSession = require("express-session");
app.use(
  expressSession({ 
    resave: false,
    saveUninitialized: true,
//  https://stackoverflow.com/questions/33958907/express-session-not-persisting-after-cors-calls    
//  cookie: {secure:false,httpOnly:false,sameSite:'lax'}, // trying to use port 3000 & 8080 together?
    secret:
      process.env.SESSION_SEC || "You must generate a random session secret"
  })
);
app.use(passport.initialize()); // must follow use of expressSession!
app.use(passport.session());    // also required

// Flash
const flash = require("express-flash-messages");
app.use(flash());

passport.serializeUser(function(user, done) {
// TDD:  console.log(`passport.serializeUser() user=\n${JSON.stringify(user)}\n\n`);
  done(null, user.user_id); // Just need a unique ID here; stored in Session
});

passport.deserializeUser(function(userId, done) {
  User.findById(userId, (err, user) => {
// TDD:    console.log(`passport.deserializeUser() User.findById() callback; user=\n${JSON.stringify(user)}\nError=${err}\n\n`);
    done(err, { user_id:user.user_id, username:user.user_login } ); // Put whatever we want available to routes in 'req' object
  });
});

// Passport Local
const LocalStrategy = require("passport-local").Strategy;
const local = new LocalStrategy((username, password, done) => {
  User.findByUsername(username)
    .then(user => {
      console.log(`
        passport use LocalStrategy: User.findByUsername() callback; 
        user==:\n${JSON.stringify(user)}\n
        and, User.validPassword(user,password)("${password}")=${User.validPassword(user,password)}\n`);

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

// view engine setup
const expressHandlebars = require("express-handlebars");
const hbs = expressHandlebars.create({ defaultLayout: "application" });
app.engine("handlebars", hbs.engine);
app.set('view engine', "handlebars");
app.set('views', path.join(__dirname, 'views'));
app.options('*', cors()); // needed during dev on port 3000 after login to server on port 8080

//app.use(logger('dev'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

// Both of following work, use first if gzipping for production!
// Note: Should match test in environment.ts
if (process.env.COMPUTERNAME==='BASERAMP') // TODO: Dup of code below; change to setting????
  app.use(express.static(path.join(__dirname, 'build')));
else
  app.use(expressStaticGzip(path.join(__dirname, 'build')));


//CORS Middleware
app.use(function (req, res, next) {
  //Enabling CORS 
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, access-control-request-headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, authorization, X-Auth-Token, X-Accept-Charset,X-Accept");  
  next();
});

app.use('/api', 
  process.env.COMPUTERNAME==='BASERAMP' ?  
    cors({origin: '*'})            // Required for local development
    : [ ],                         // Not required for Azure deployment        
  apiRouter );

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


module.exports = app;
