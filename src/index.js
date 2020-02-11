
var express = require('express');
var app = express();
var path = require('path');
var mongo = require('mongodb').MongoClient;


const url = 'mongodb://site181908:yiHui2re@mongo_site181908'

/*
app.route('/db').get(function(req, res) {
    mongo.connect(url, function(err, db) {
       var collection = db.collection('pointOfInterest');
       var cursor = collection.find({});
       str = "";
       cursor.forEach(function(item) {
           if (item != null) {
                   str = str + "    Name  " + item.name + "</br>";
           }
       }, function(err) {
           res.send(err);
           db.close();
          }
       );
   });
});
*/



/* test login google
var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

fine test */



app.use(express.static(path.join(__dirname + '/')));

app.get('/',
(req, res) => res.sendFile(path.join(__dirname + '/index.html')));
app.listen(8000,
() => console.log(' app listening on port 8000!'));
