var User = require('../models/user');
var Post = require('../models/post');
var emberObjWrapper = require('../wrappers/emberObjWrapper');

exports.getPosts = function(req, res){
  var authenticatedUser = req.user;
  var userId = req.query.user;
  var emberUserPosts = [];
  if(userId && authenticatedUser){
    // At UserRoute
    Post.find({'user': userId}).sort({date:-1}).limit(20).exec(function(err, posts){
      if(posts != null) {
        posts.forEach(
          function(post){
            emberUserPosts.push(emberObjWrapper.emberPost(post));
          }
        )
      }
      return res.send(200, {posts: emberUserPosts}); 
    });
  } else if(!userId && authenticatedUser){
    // At PostsRoute with logged-in (authenticated user)
    // Posts by following users of authenticated user
    // console.log(' ');
    // console.log(' =========== GET Posts from following users');
    // console.log('authenticatedUser.id : '+ authenticatedUser);
    User.findOne({'username': authenticatedUser.username}, function(err, authUser){
      Post.find({'user': {$in: authUser.followees}}).sort({date:-1}).limit(20).exec(function(err, posts){
        if(posts != null) {
          // console.log('posts: '+posts);
          posts.forEach(
            function(post){
              emberUserPosts.push(emberObjWrapper.emberPost(post));
            }
          )
        }
        return res.send(200, {posts: emberUserPosts}); 
      });
    });
  } else {
    Post.find({}).sort({date:-1}).limit(20).exec(function(err, posts){
      if(posts != null) {
        posts.forEach(
          function(post){
            emberUserPosts.push(emberObjWrapper.emberPost(post));
          }
        )
      }
      return res.send(200, {posts: emberUserPosts}); 
    });  
  }
};
 
exports.publishPost = function(req, res){
  if(req.user.username == req.body.post.user){
    var newPost = new Post({
      body: req.body.post.body,
      user: req.body.post.user,
    });
 
    newPost.save(function(err, post){
      if(err) return console.log(err);
      return res.send(200, {post: emberObjWrapper.emberPost(post)}); // Not array - singular
    });

  } else {
    res.send(403);
  }
};
 
exports.deletePost =  function(req, res){
  var postToDelete = req.params.post_id;
  Post.findById(postToDelete, function(err, post){
    if(err) console.log(err);
    post.remove(function(err){
      if(err) console.log(err);
      return res.send(200);
    });
  });
};