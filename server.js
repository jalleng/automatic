'use strict';

let port = process.env.PORT || 3000;
let http = require('http');
let express = require('express');
let app = express();
let session = require('express-session');
let cors = require('cors');
require('dotenv').load({silent: true});
let AUTOMATIC_CLIENT_ID = process.env.AUTOMATIC_CLIENT_ID;
let AUTOMATIC_CLIENT_SECRET = process.env.AUTOMATIC_API_KEY;
app.use(cors());
app.use(express.static(__dirname + '/build'));

const oauth2 = require('simple-oauth2')({
  clientID: AUTOMATIC_CLIENT_ID,
  clientSecret: AUTOMATIC_CLIENT_SECRET,
  site: 'https://accounts.automatic.com',
  tokenPath: '/oauth/access_token'
});

const authorizationUri = oauth2.authCode.authorizeURL({
  scope: 'scope:user:profile scope:trip scope:location scope:vehicle:profile scope:vehicle:events scope:behavior'
});

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.get('/auth', (req, res) => {
  res.redirect(authorizationUri);
});

app.get('/redirect', (req, res) => {
  const code = req.query.code;

  function saveToken(error, result) {
    if (error) {
      console.log('Access token error', error.message);
      res.send('Access token error: ' +  error.message);
      return;
    }

    // Attach `token` to the user's session for later use
    // This is where you could save the `token` to a database for later use
    req.session.token = oauth2.accessToken.create(result);

    res.redirect('/welcome');
  }

  oauth2.authCode.getToken({
    code: code
  }, saveToken);
});

app.get('/welcome', (req, res) => {
  if (req.session.token) {
    // Display token to authenticated user
    console.log('Automatic access token', req.session.token.token.access_token);
    res.send('You are logged in.<br>Access Token: ' +  req.session.token.token.access_token);
  } else {
    // No token, so redirect to login
    res.redirect('/');
  }
});

app.get('/', (req, res) => {
  res.send('<a href="/auth">Log in with Automatic</a>');
});

// app.get('/callback', function(req,res) {

// })



app.listen(port);
console.log('Express server started on port ' + port);