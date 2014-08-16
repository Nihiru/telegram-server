var passport = require('passport');
var bcrypt   = require('bcrypt');
var config   = require('../config');
var logger   = require('nlogger').logger(module);

require('../authentications/passport')(passport);

var conn = require('../dbconnection').defaultConnection;
var User = conn.model('User');
var emberObjWrapper = require('../wrappers/emberObjWrapper');
var resetPass       = require('../resetPass/sendNewPass');
var userOperation   = exports;

userOperation.register = function(req, res){
  var randomNum = Math.floor(5*Math.random());
  var avatar    = 'images/avatar-'+randomNum+'.png';
  var hasedPassword = null;

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

      logger.info('Registering User.username: ', newUser.username);

      newUser.save(function(err, user){
        req.login(user, function(err) {
          if (err) { 
            return res.send(400); 
          }  
          logger.info('emberObjWrapper.emberUser(user): ', emberObjWrapper.emberUser(user));
          return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
        });
      });

    });
  });
};

function getFollowees(currentUserAsFollower, authUser, callback){
  logger.info("GET ", currentUserAsFollower, " 's followees", " authUser is ", authUser.username);

  var emberFollowees = [];

  User.find({'followers': currentUserAsFollower}).
    sort({date:-1}).
    limit(20).
    exec(function(err, followees){

    if(err){
      logger.error('Error on finding followees: ', err);
    } else {
      if(followees){
        logger.info('All the followees: ', followees);

        followees.forEach(function(user){
          logger.info('A followee username: ', user.username);

          emberFollowees.push(emberObjWrapper.emberUser(user, authUser.username));
        })
      };
      emberFollowees.push(emberObjWrapper.emberUser(authUser));
      logger.info('emberFollowees + myself: ', emberFollowees);
    }
    callback(err, emberFollowees);

  });
}

function getFollowers(currentUserAsFollowee, authUser, callback){
  logger.info("GET ", currentUserAsFollowee, " 's followers", "authUser: ", authUser.username);
  var emberFollowers = [];

  User.find({'followees': currentUserAsFollowee}).sort({date:-1}).limit(20).exec(function(err, followers){
    if(err){ 
      logger.error('Error on finding followers: ', err);
    } else {

      if(followers){
        logger.info('All the followers: ', followers);
        followers.forEach(function(user){
          logger.info('A follower username: ', user.username);
          emberFollowers.push(emberObjWrapper.emberUser(user, authUser.username));
        })
      }
      emberFollowers.push(emberObjWrapper.emberUser(authUser));
      logger.info('emberFollowees + myself: ', emberFollowers);
    } 
    callback(err, emberFollowers);
  });
}

userOperation.userQueryHandlers = function(req, res, next){

  var username      = req.query.username;
  var password      = req.query.password;
  var email         = req.query.email;
  var operation     = req.query.operation;
  var currentUserAsFollower = req.query.follower;
  var currentUserAsFollowee = req.query.followee;
  var isAuthenticated = req.query.isAuthenticated;

  if(operation == 'login'){
    logger.info('LOGIN PROCESS');

    passport.authenticate('local', function(err, user, info) {

      if (err) { 
        logger.error('Error on passport.authenticate(): ', err); 
        return res.send(400); 
      }
      if (!user) { return res.send(400); }

      req.login(user, function(err) {
        if (err) { 
          logger.error('Error on login(): ', err); 
          return res.send(400); 
        }
        logger.info('emberObjWrapper.emberUser(user): ', emberObjWrapper.emberUser(user));
        return res.send(200, {user: [emberObjWrapper.emberUser(user)]});
      });

    })(req, res, next);

  } else if(currentUserAsFollower){
    logger.info('/username/followings PROCESS');

    getFollowees(currentUserAsFollower, req.user, function(err, users){
      if(err){
        logger.error('Error on getFollowees(): ', err);
        return res.send(404);

      } else if(users){
        logger.info('Followees: ', users);
        return res.send(200, {users: users});

      } else {
        logger.error('Internal Server Error 500');
        return res.send(500);

      }
    });

  } else if(currentUserAsFollowee){
    logger.info('/username/followers PROCESS');

    getFollowers(currentUserAsFollowee, req.user, function(err, users){
      if(err){
        logger.error('Error on getFollowers(): ', err);
        return res.send(404);

      } else if(users){
        logger.info('Followers: ', users);
        return res.send(200, {users: users});

      } else {

        logger.error('Internal Server Error 500');
        return res.send(500);
      }
    });

  } else if (operation == 'resetPassword' && username && email){

    resetPass.sendNewPass(req, res, username, email);

  } else if (isAuthenticated == 'true'){
    logger.info('req.user: ', req.user);
    logger.info('req.isAuthenticated ?: ',req.isAuthenticated());

    if (req.user){
      logger.info('isAuthenticated == true. You are: ', req.user.username);
      return res.send(200, {user: [emberObjWrapper.emberUser(req.user)]});

    } else {
      logger.info('Not logged in / registered yet');
      return res.send(200);
    }

  } else {
    logger.error('No matched user found');
    return res.send(404);
  }
};

userOperation.getUser = function(req, res){
  logger.info('getUser() in PROCESS');

  function getTheUser(user_id, authUser){
    User.findOne({'username': user_id}, function(err, user){

      if(user != null) { 
        if(authUser){
          logger.info('Logged-in as: ', authUser, ' get this user: ', emberObjWrapper.emberUser(user, authUser));
          return res.send(200, {user: emberObjWrapper.emberUser(user, authUser)});

        } else {
          logger.info('Not Logged In. getTheUser: ', emberObjWrapper.emberUser(user));
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
      logger.error('Error 404 on not-logged-in');
      return res.send(404);
    }  

  } else {
    var authUser = req.user.username,
        userId   = req.params.user_id;

    if(authUser && userId){
      getTheUser(userId, authUser);

    } else {
      logger.error('Error 404 on logged-in');
      return res.send(404);
    }  
  }
};

userOperation.logout = function(req, res){
  req.logout();
  logger.info('Logged Out Successfully');
  res.send(200);
};