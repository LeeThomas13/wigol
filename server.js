'use strict';

// Configurations
require('dotenv').config();
require('ejs');

// Application Dependencies
const cors = require('cors');

const passport = require('passport');

const SpotifyStrategy = require('passport-spotify').Strategy;

// const { request, response } = require('express');
const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');
const superagent = require('superagent');

// Application Setup
const app = express();
app.use(cors());
app.use(passport.initialize());

// Port Setup
const PORT = process.env.PORT || 3001
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => {
  console.log(error);
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride('_method'));

// Routes
app.get('/', renderHomePage);
app.get('/team', renderTeamPage);
app.get('/search', getSearchResults);
app.post('/songs', addSongToDatabase);
// Details Callback Function
// Update Callback Function
// Delete Callback Function
// Catch All Error Function

// ====================================================================================================

const authCallbackPath = '/auth/spotify/callback';

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:' + PORT + authCallbackPath,
    },
    //   callbackURL will change when we have to deploy to heroku
    function (accessToken, refreshToken, expires_in, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        // To keep the example simple, the user's spotify profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the spotify account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  )
);

app.get('/auth/spotify',
  passport.authenticate('spotify',
    { scope: ['user-read-email', 'user-read-private'],
      showDialog: true})
);
//   GET /auth/spotify/callback
//     Use passport.authenticate() as route middleware to authenticate the
//     request. If authentication fails, the user will be redirected back to the
//     login page. Otherwise, the primary route function function will be called,
//     which, in this example, will redirect the user to the home page.

app.get( authCallbackPath,
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  }
);
app.get('/login', function (req, res) {
  res.status(200).send('we are pineapple');
})
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// ==================================================================================================

function renderHomePage(request, response) {
  response.status(200).render('index.ejs');
}

function getSearchResults(request, response) {
  // console.log(request.query);
  let url = `https://api.lyrics.ovh/v1/${request.query.artist}/${request.query.song}`;
  // const queryObject = {
  //     artist: request.query.artist,
  //     title: request.query.song
  // }
  superagent.get(url)
    .then(data => {
      console.log(data.body);
      let info = {};
      info.lyrics = data.body.lyrics;
      info.artist = request.query.artist;
      info.title = request.query.song;
      console.log(info);
      response.status(200).render('pages/search/show', {info : info});
    })
    .catch(error => {
      console.log(error)
      response.render('error.ejs');
    })
    // const sql = 'SELECT * FROM chartlyric;';
    // client.query(sql)
    //     .then(results => {
    //         let mySongs = results.rows;
    //         response.status(200).render('pages/search/show', {mySongs : mySongs});
    //     })
    //     .catch(error => {
    //         console.log(error)
    //         response.render('error.ejs');
    //     })
}

function renderTeamPage(request, response) {
  response.status(200).render('pages/team');
}

function addSongToDatabase(request, respond) {
  const {lyrics, artist, song} = request.body;
}
// function Words(object) {
//     this.artist = object.artist;
//     this.song = object.song;
// }

// Connect Port
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Wigoling on ${PORT}`);
    });
  })
