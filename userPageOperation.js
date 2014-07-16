var passport = require('passport');
require('./passport')(passport);
var User = require('./models/user');
var Post = require('./models/post');

exports.follow = function(req, res, next){
	// console.log("User to follow = " + req.query.user);
	// console.log("LoggedInUser = " + req.user.username);
	var newFollowingUser = req.query.user;
	var loggedInUser = req.user.username;
	// == Store the profile user at ths url to loggedIn user's followerings ==
	User.findOne({'username': loggedInUser}, function(err, result){
		// console.log("Before push result = "+ result);
		if(result) {
			result.followings.push(newFollowingUser);
			// console.log("After push result = " + result);
			result.save(function(err, user){
				// console.log('save : '+user);
				if(user) { 
		      // console.log('saved : '+user);
		      // console.log("==== Store loggedIn user to following user's followers ====")
		      User.findOne({'username': newFollowingUser}, function(err, followingUser){
		      	// console.log("followingUser : " + followingUser);
		      	if(followingUser){
		      		followingUser.followers.push(loggedInUser);
		      		followingUser.save(function(err, aUser){
		      			// console.log("Saved : " + aUser);
		      			return res.send(200);
		      		});
		      		// console.log("Saved followingUser : " + followingUser);
		      	} else {
		      		return res.send(400);
		      	}
		      });
				} else {
					return res.send(400);
				};
			});
		} else {
			return res.send(404);
		};
	});
};