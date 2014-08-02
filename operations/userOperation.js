var passport = require('passport'),
    bcrypt = require('bcrypt'),
    config = require('../config');
require('../authentications/passport')(passport);

var User = require('../models/user'),
    emberObjWrapper = require('../wrappers/emberObjWrapper'),
    resetPass = require('../resetPass/sendNewPass');

exports.checkLoggedInUserExistance = function(req, res){
  // console.log('req.user: ' + req.user);
  // console.log('Before req.user : isAuthenticated = ' + req.isAuthenticated());
  if (req.user){
    return res.send(200, {user: emberObjWrapper.emberUser(req.user)});
  } else {
    return res.send(200, {user: null});
  }
};

exports.register = function(req, res){
  var randomNum = Math.floor(5*Math.random()),
      avatar = 'images/avatar-'+randomNum+'.png',
      hasedPassword;

  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(req.body.user.password, salt, function(err, hash) {
      hasedPassword = hash;
      var newUser = new User({
        username: req.body.user.username,
        name:     req.body.user.name,
        email:    req.body.user.email,
        password: hasedPassword,
        avatar:   avatar
      });

      newUser.save(function(err, user){
        req.login(user, function(err) { // Set cookie here 
          if (err) { return res.send(400); }  
          return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
        });
      });
    });
  });
};

exports.userQueryHandlers = function(req, res, next){
  var username      = req.query.username,
      password      = req.query.password,
      email         = req.query.email,
      operation     = req.query.operation,
      currentUserAsFollower = req.query.follower,
      currentUserAsFollowee = req.query.followee;

  function getFollowees(currentUserAsFollower, authenticatedUser){
    var emberFollowees = [];
    User.find({'followers': currentUserAsFollower}).sort({date:-1}).limit(20).exec(function(err, followees){
      if(followees){
        followees.forEach(function(user){
          emberFollowees.push(emberObjWrapper.emberUser(user, authenticatedUser));
        })
        return res.send(200, {users: emberFollowees});
      };
    });
  }

  function getFollowers(currentUserAsFollowee, authenticatedUser){
    var emberFollowers = [];
    User.find({'followees': currentUserAsFollowee}).sort({date:-1}).limit(20).exec(function(err, followers){
      if(followers){
        followers.forEach( function(user){
          emberFollowers.push(emberObjWrapper.emberUser(user, authenticatedUser));
        })
        return res.send(200, {users: emberFollowers});
      };
    });
  }

  if(operation == 'login'){
    passport.authenticate('local', function(err, user, info) {
      if (err) { return res.send(400); }
      if (!user) { return res.send(400); }
      req.login(user, function(err) { // Set cookie here 
        if (err) { return res.send(400); }
        return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
      });
    })(req, res, next);
  } else if(currentUserAsFollower){ //GET Followees of current URL user
    getFollowees(currentUserAsFollower, req.user.username);
  }
  else if(currentUserAsFollowee){ //GET Followers of current URL user
    getFollowers(currentUserAsFollowee, req.user.username);
  } else if(operation == 'resetPassword' && username && email){
    resetPass.sendNewPass(req, res, username, email);
  }
};

exports.getUser = function(req, res){
  function getTheUser(user_id, authenticatedUser){
    User.findOne({'username': userId}, function(err, user){
      if(user != null) { 
        if(authenticatedUser){
          return res.send(200, {user: emberObjWrapper.emberUser(user, authenticatedUser)});
        } else {
          return res.send(200, {user: emberObjWrapper.emberUser(user)});
        }
      } else {
        return res.send(404);
      }
    });  
  }

  if(!req.user){
    if(req.params.user_id) {
      var userId = req.params.user_id;
      getTheUser(userId);
    } else {
      return res.send(404);
    }  
  } else {
    var authenticatedUser = req.user.username,
        userId            = req.params.user_id;
    if(authenticatedUser && userId){
      getTheUser(userId, authenticatedUser);
    } else {
      return res.send(404);
    }  
  }
};

exports.logout = function(req, res){
  req.logout();
  res.send(200);
};