var passport = require('passport');
require('./passport')(passport);
var User = require('./models/user');
var emberObjWrapper = require('./emberObjWrapper');

exports.register = function(req, res){
  var randomNum = Math.floor(5*Math.random());
  var avatar = 'images/avatar-'+randomNum+'.png';

  var newUser = new User({
    username: req.body.user.username,
    name: req.body.user.name,
    eamil: req.body.user.email,
    password: req.body.user.password,
    avatar: avatar
  });

  newUser.save(function(err, user){
    req.login(user, function(err) { // Set cookie here 
      if (err) { return res.send(400); }  
      return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
    });
  });
};

exports.loginOrGetFolloweesOrFollowers = function(req, res, next){
  var username      = req.query.username,
      password      = req.query.password,
      operation     = req.query.operation,
      currentUserAsFollower      = req.query.follower,
      currentUserAsFollowee      = req.query.followee;

  if(operation == 'login'){
    passport.authenticate('local', function(err, user, info) {
      if (err) { return res.send(400); }
      if (!user) { return res.send(400); }
      req.login(user, function(err) { // Set cookie here 
        if (err) { return res.send(400); }
        return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
      });
    })(req, res, next);

  // ======= GET Followees (users that current URL user follows)=======
  // Check if current URL user is in the array of followers of any users
  } else if(currentUserAsFollower){
    console.log(' ');
    var emberFollowees = [];
    console.log("currentUser As Follower: "+currentUserAsFollower);
    User.find({'followers': currentUserAsFollower}, function(err, followees){
      console.log(currentUserAsFollower+"'s followees : " + followees);
      if(followees){
        followees.forEach(
          function(user){
            emberFollowees.push(emberObjWrapper.emberUser(user, currentUserAsFollower));
          }
        )
        return res.send(200, {users: emberFollowees});
      };
    });
  }
  // ======= GET Followers (users that follows current URL user)=======
  // Check if current URL user is in the array of followees of any users
  else if(currentUserAsFollowee){
    console.log(' ');
    var emberFollowers = [];
    console.log("currentUser As Followee: "+currentUserAsFollowee);
    User.find({'followees': currentUserAsFollowee}, function(err, followers){
      console.log(currentUserAsFollowee + "'s followers : "+followers);
      if(followers){
        followers.forEach(
          function(user){
            emberFollowers.push(emberObjWrapper.emberUser(user, currentUserAsFollowee));
          }
        )
        return res.send(200, {users: emberFollowers});
      };
    });
  }
};

exports.getUser = function(req, res){
  var userId = req.params.user_id;
  User.findOne({'username': userId}, function(err, user){
    if(user != null) { 
      return res.send(200, {user: emberObjWrapper.emberUser(user)});
    } else {
      console.log('====== NOP =======');
      return res.send(404);
    }
  });
};

exports.logout = function(req, res){
  req.logout();
  res.send(200);
};