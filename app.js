var createError = require('http-errors');
var express = require('express');
var path = require('path');
//var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');
var app = express();
var cors = require('cors');  
var passport = require('passport');
var Strategy = require('passport-http').BasicStrategy;
const { findByUsername } = require('./routes/util');
var expressStaticGzip = require("express-static-gzip");

// Configure the Basic strategy for use by Passport.
// The Basic strategy requires a `verify` function which receives the
// credentials (`username` and `password`) contained in the request.  The
// function must verify that the password is correct and then invoke `cb` with
// a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy(
  function(username, password, cb) {
    findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.user_password_hash != password) { return cb(null, false); }
      return cb(null, user);
    });
}));
  
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
 
app.use(logger('dev'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());

// Both of following work, use first if gzipping for production!
app.use(expressStaticGzip(path.join(__dirname, 'build')));
//app.use(express.static(path.join(__dirname, 'build')));

//CORS Middleware
app.use(function (req, res, next) {
  //Enabling CORS 
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header('Access-Control-Allow-Credentials', 'true'); 
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, access-control-request-headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, authorization, Access-Control-Allow-Credentials, X-Auth-Token, X-Accept-Charset,X-Accept");  
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
/*
app.use('/api', 
  cors({credentials: true, origin: '*'}), 
  passport.authenticate('basic', { session: false }),
  apiRouter );
*/

app.use('/api', 
  process.env.COMPUTERNAME==='BASERAMP' ?  
    cors({credentials: true, origin: '*'})            // Required for local development
    : [ ],                                            // Not required for Azure deployment        
  passport.authenticate('basic', { session: false }), // Require authentication to access all API routes
  apiRouter );


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
