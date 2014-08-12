var passport = require('passport'),
    bcrypt = require('bcrypt'),
    config = require('../config'),
    logger = require('nlogger').logger(module);

require('../authentications/passport')(passport);
var conn = require('../dbconnection').defaultConnection;

var User = conn.model('User')
    emberObjWrapper = require('../wrappers/emberObjWrapper'),
    resetPass = require('../resetPass/sendNewPass');
    userOperation = exports;
    
userOperation.checkLoggedInUserExistance = function(req, res){
  logger.info('req.user: ' + req.user);
  logger.info('req.isAuthenticated ?: ' + req.isAuthenticated());
  if (req.user){
    return res.send(200, {user: emberObjWrapper.emberUser(req.user)});
  } else {
    return res.send(200, {user: null});
  }
};

userOperation.register = function(req, res){
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
      logger.info('Registering User: '+newUser);

      newUser.save(function(err, user){
        req.login(user, function(err) { // Set cookie here 
          if (err) { return res.send(400); }  
          logger.info('emberObjWrapper.emberUser(user): '+emberObjWrapper.emberUser(user));
          return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
        });
      });
    });
  });
};

function getFollowees(currentUserAsFollower, authenticatedUser, callback){
  logger.info('GET Followees');
  var emberFollowees = [];
  User.find({'followers': currentUserAsFollower}).sort({date:-1}).limit(20).exec(function(err, followees){
    if(err){
      logger.error('Error: '+err);
    } else {
      if(followees){
        // logger.info('followees: '+followees);
        followees.forEach(function(user){
          logger.info('A Followee username: '+user.username);
          emberFollowees.push(emberObjWrapper.emberUser(user, authenticatedUser));
        })
      };
      logger.info('emberFollowees: '+emberFollowees);
    }
    callback(err, emberFollowees);
  });
}

function getFollowers(currentUserAsFollowee, authenticatedUser, callback){
  logger.info('GET Followers');
  var emberFollowers = [];
  User.find({'followees': currentUserAsFollowee}).sort({date:-1}).limit(20).exec(function(err, followers){
    if(err){ 
      logger.error(err);
    } else {
      if(followers){
        // logger.info('followers: '+followers);
        followers.forEach(function(user){
          logger.info('A Follower username: '+user.username);
          emberFollowers.push(emberObjWrapper.emberUser(user, authenticatedUser));
        })
      }
      logger.info('emberFollowees: '+emberFollowers);
    } 
    callback(err, emberFollowers);
  });
}

userOperation.userQueryHandlers = function(req, res, next){
  var username      = req.query.username,
      password      = req.query.password,
      email         = req.query.email,
      operation     = req.query.operation,
      currentUserAsFollower = req.query.follower,
      currentUserAsFollowee = req.query.followee;
      // authenticatedUser = req.user.username;

  if(operation == 'login'){
    logger.info('LOGIN PROCESS');
    passport.authenticate('local', function(err, user, info) {
      if (err) { return res.send(400); }
      if (!user) { return res.send(400); }
      req.login(user, function(err) { // Set cookie here 
        if (err) { logger.error(err); return res.send(400); }
        logger.info('emberObjWrapper.emberUser(user): '+emberObjWrapper.emberUser(user));
        return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
      });
    })(req, res, next);

  } else if(currentUserAsFollower){ //GET Followees of current URL user
    logger.info('/username/followings PROCESS');
    getFollowees(currentUserAsFollower, req.user.username, function(err, users){
      if(err){
        logger.error('Error on getFollowees(): '+err);
        return res.send(404);
      } else if(users){
        logger.info('Followees: '+users);
        return res.send(200, {users: users});
      } else {
        logger.error('Internal Server Error 500');
        return res.send(500);
      }
    });

  } else if(currentUserAsFollowee){ //GET Followers of current URL user
    logger.info('/username/followers PROCESS');
    getFollowers(currentUserAsFollowee, req.user.username, function(err, users){
      if(err){
        logger.error('Error on getFollowers(): '+err);
        return res.send(404);
      } else if(users){
        logger.info('Followers: '+users);
        return res.send(200, {users: users});
      } else {
        logger.error('Internal Server Error 500');
        return res.send(500);
      }
    });

  } else if(operation == 'resetPassword' && username && email){
    resetPass.sendNewPass(req, res, username, email);
  }
};

userOperation.getUser = function(req, res){
  logger.info('getUser() PROCESS');
  function getTheUser(user_id, authenticatedUser){
    User.findOne({'username': userId}, function(err, user){
      if(user != null) { 
        if(authenticatedUser){
          logger.info('Logged In As: '+authenticatedUser);
          logger.info('getTheUser: '+ emberObjWrapper.emberUser(user, authenticatedUser));
          return res.send(200, {user: emberObjWrapper.emberUser(user, authenticatedUser)});
        } else {
          logger.info('Not Logged In');
          logger.info('getTheUser: '+ emberObjWrapper.emberUser(user));
          return res.send(200, {user: emberObjWrapper.emberUser(user)});
        }
      } else {
        logger.error('Error 404');
        return res.send(404);
      }
    });  
  }

  if(!req.user){
    if(req.params.user_id) {
      var userId = req.params.user_id;
      getTheUser(userId);
    } else {
      logger.error('Error 404');
      return res.send(404);
    }  
  } else {
    var authenticatedUser = req.user.username,
        userId            = req.params.user_id;
    if(authenticatedUser && userId){
      getTheUser(userId, authenticatedUser);
    } else {
      logger.error('Error 404');
      return res.send(404);
    }  
  }
};

userOperation.logout = function(req, res){
  req.logout();
  logger.info('Logged Out Successfully');
  res.send(200);
};