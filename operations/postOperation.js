var conn = require('../dbconnection').defaultConnection,
    User = conn.model('User'),
    Post = conn.model('Post'),
    emberObjWrapper = require('../wrappers/emberObjWrapper'),
    postOperation = exports,
    logger = require('nlogger').logger(module);

postOperation.getPosts = function(req, res){
  var followeesOf = req.query.followeesOf;
  var authenticatedUser = req.user;
  var userId = req.query.user;
  var emberUserPosts = [];
  var emberPostUsers = [];

  logger.info('==+++ getPosts +++==');
  if(userId){
    // At UserRoute
    logger.info(" ========== userId =========== ");
    Post.find({'user': userId}).sort({date:-1}).limit(20).exec(function(err, posts){
      if(posts != null) {
        posts.forEach(
          function(post){
            emberUserPosts.push(emberObjWrapper.emberPost(post));
            logger.info(post);
            User.findOne({'username': post.user}, function(err, user){
              emberPostUsers.push(emberObjWrapper.emberPostUser(user));
              logger.info('+++ USER +++:')
              logger.info(emberObjWrapper.emberPostUser(user));
            });
          }
        )
      }
      logger.info('emberUserPosts: '+emberUserPosts);
      logger.info(emberPostUsers);
      return res.send(200, {posts: emberUserPosts, users: emberPostUsers}); 
    });
  } else if(!userId && authenticatedUser.username === followeesOf){ // For authenticated user to see posts from followees
    logger.info(" ========== !userId && authenticatedUser =========== ");
    Post.find(
      {$or: 
        [
          {'user': {$in: authenticatedUser.followees}},
          {'user': authenticatedUser.username}
        ]
      }
    ).sort({date:-1}).limit(20).exec(function(err, posts){
      if(posts != null) {
        logger.info('posts: '+posts);
        posts.forEach(
          function(post){
            emberUserPosts.push(emberObjWrapper.emberPost(post));
            logger.info(post);
            User.findOne({'username': post.user}, function(err, user){
              emberPostUsers.push(emberObjWrapper.emberPostUser(user));
              logger.info('+++ USER +++:')
              logger.info(emberObjWrapper.emberPostUser(user));
            });
          }
        )
      }
      logger.info('emberUserPosts: '+emberUserPosts);
      logger.info(emberPostUsers);
      logger.info(emberPostUsers[1]);
      return res.send(200, {posts: emberUserPosts, users: emberPostUsers}); 
    });
  } else {
    logger.error('404');
    return res.send(404);
  }
};
 
postOperation.publishPost = function(req, res){
  logger.info('==== publishPost ====');
  if(req.user.username == req.body.post.user){
    var newPost = new Post({
      body: req.body.post.body,
      user: req.body.post.user,
    });
    logger.info('newPost: '+newPost);
    newPost.save(function(err, post){
      if(err) return logger.error(err);
      return res.send(200, {post: emberObjWrapper.emberPost(post)}); // Not array - singular
    });

  } else {
    logger.error('403');
    res.send(403);
  }
};
 
postOperation.deletePost =  function(req, res){
  var postToDelete = req.params.post_id;
  logger.info(' Deleting this post id: '+postToDelete)
  Post.findById(postToDelete, function(err, post){
    if(err) logger.error(err);
    post.remove(function(err){
      if(err) logger.error(err);
      return res.send(200);
    });
  });
};