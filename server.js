var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
  console.log("Serialize User");
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  console.log("Deserialize User");
  for(var i=0; i < User.length ; i++){
    if(id === User[i].id){
      done(null, User[i]);
    }
  }
});

passport.use('local', new LocalStrategy(
  function(username, password, done) {
    var found = false;
    for(var i=0; i < User.length ; i++){
      if(username === User[i].id && 
         password === User[i].password){
        found = true;
        console.log('success');
        return done(null, user);
      }
    }
    if(found === false){
      console.log('failed');
      return done(null, false);
    }
  }
));

app.use(bodyParser());
app.use(cookieParser());
app.use(session({ secret: 'secret_key' }));
app.use(passport.initialize());
app.use(passport.session());

var Post = [
  {
    id: 1,
    body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad mini',
    user: 'will',
    date: 'Tue, 06 May 2014 21:03:32 GMT'
  },{
    id: 2,
    body: 'Salut! This is 2nd oldest post, from Joseph!',
    user: 'joseph',
    date: 'Sat, 10 May 2014 21:33:30 GMT'
  },{
    id: 3,
    body: 'Hey everyone, I am Gal Gagot!',
    user: 'gal',
    date: 'Tue, 20 May 2014 22:33:32 GMT'
  },{
    id: 4,
    body: 'What up! This is latest post!',
    user: 'beyonce',
    date: 'Thu, 29 May 2014 23:33:30 GMT'
  }];

var User = [
  {
    id: 'will',
    name: 'Will Smith',
    email: 'will@example.com',
    password: 'password',
    avatar: 'images/will.jpg'
  },{
    id: 'beyonce',
    name: 'Beyonce Knowles',
    email: 'beyonce@example.com',
    password: 'password',
    avatar: 'images/beyonce.jpeg'
  },{
    id: 'joseph',
    name: 'Joseph Gordon-Levitt',
    email: 'joseph@example.com',
    password: 'password',
    avatar: 'images/joseph.jpeg'
  },{
    id: 'gal',
    name: 'Gal Gagot',
    email: 'gal@example.com',
    password: 'password',
    avatar: 'images/gal.jpg'
  }];

// =========== Register ===========
app.get('/', function(req, res){
  res.send('Register');
});

app.post('/api/users', function(req, res){
  // console.log(req.body.user);
  var userInfo = {      
    id: req.body.user.id,
    name: req.body.user.name,
    eamil: req.body.user.email,
    password: req.body.user.password,
    avatar: null
  };
  // console.log(userInfo);
  User.push(userInfo);
  res.send(200, {user: userInfo});
  // res.redirect('/api/posts');
});

// =========== Login ===========
app.get('/login', function(req, res){
  res.send('Login');
});

app.get('/api/users', function(req, res, next){
  var username = req.query.id;
  var password = req.query.password;
  var operation = req.query.operation;

  if(operation == 'login'){
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.send(404); }
      req.login(user, function(err) {
        if (err) { return next(err); }
        return user;
      });
    })(req, res, next);
  }
});

app.get('/api/users/:user_id', function(req, res){
  var username = req.params.user_id;
  var found = false;
  for(var i=0; i < User.length ; i++){
    if(username === User[i].id){
      found = true;
      res.send(200, {user: User[i]});
    }
  } 
  if(found === false){
    res.send(400);
  }
});

app.get('/api/resetpassword',  function(req, res){});
app.post('/api/resetpassword', function(req, res){});
app.get('/api/sentpassnotify', function(req, res){});

// =========== GET Posts ===========
app.get('/api/posts', function(req, res){
  res.send(200, {posts: Post});
});
// =========== CREATE post ===========
app.post('/api/posts', function(req, res){
  var newPostId = Post.length+1;
  // console.log(req.body.post);
  // console.log("New Post id: "+newPostId);
  var newPost = { 
    id: newPostId,
    body: req.body.post.body,
    user: req.body.post.user,
    date: req.body.post.date
  };
  Post.push(newPost);
  res.send(200, {post: newPost});
  // res.redirect('/api/posts')
});
// =========== DELETE post ===========
app.delete('/api/posts/:post_id', function(req, res){
  var postToDelete = req.params.post_id;
  // console.log("Delete Post id: "+req.params.post_id);
  var found = false;
  for(var i=0; i < Post.length ; i++){
    if(postToDelete == Post[i].id){
      // console.log("Post body in array: "+Post[i].body);
      found = true;
      Post.splice(Post.indexOf(Post[i]), 1);
      res.send(200);
      // res.redirect('/api/posts');
    }
  } 
  if(found == false) res.send(400);
});

// =========== User page ===========
app.get('/api/users/:user_id/following', function(req, res){
  res.send(200, {user: req.params.user_id});
});

app.get('/api/users/:user_id/followers', function(req, res){
  res.send(200, {user: req.params.user_id});
});

var server = app.listen(3000, function(){
  console.log('Listening on port %d', server.address().port);
});