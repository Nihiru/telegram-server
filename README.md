### Telegram server

* Client side repo: [https://github.com/yhagio/telegram-cli](https://github.com/yhagio/telegram-cli)

#### Todos:
* **Step1**
* nginx settings [http://yhagio.github.io/blog/2014/06/12/nginx-setup/](http://yhagio.github.io/blog/2014/06/12/nginx-setup/)
* Implement all the routes required by the ember.js app with the same dummy data from the previously used fixtures adapter (client side). 
- [Routing ](http://expressjs.com/4x/api.html#app.VERB), 
- [req.params ](http://expressjs.com/4x/api.html#req.params), 
- [res.send()](http://expressjs.com/4x/api.html#res.send)

* Deleted `res.redirect()` since in client-side takes care of the transition `.transitionToRoute()`

* Register / Login issue [https://gist.github.com/yhagio/899e743441c66e15c2f6](https://gist.github.com/yhagio/899e743441c66e15c2f6)

* **Step2 - Passport Authentication**
* Installed `passport`, `passport-local`, `cookie-parser`, `express-session`.
* Issue note [https://gist.github.com/yhagio/0e29815cd1e1f086242e](https://gist.github.com/yhagio/0e29815cd1e1f086242e)

* **Step3 - Passport Authentication 2**
* use `req.isAuthenticated` and implement `ensureAuthenticated` middleware in order to prevent publishing a post by unauthorized user
* Issue note: [https://gist.github.com/yhagio/5e2b2d11076e8aede483](https://gist.github.com/yhagio/5e2b2d11076e8aede483)

* **Step4 - MongoDB**
* Comprehension check: [Explain everything that is happening on the backend](https://gist.github.com/yhagio/7394b91dfe236ef48814)
* Ubuntu Installation of MongoDB Issue note: [https://gist.github.com/yhagio/dcc4bd40ac3a32ec5084](https://gist.github.com/yhagio/dcc4bd40ac3a32ec5084)
* Changed the address of mongoose setting `mongoose.connect('mongodb://192.168.56.10/telegram'	` ip to localhost `mongoose.connect('mongodb://127.0.0.1/telegram'	`
* MongoDB shell commands [https://gist.github.com/yhagio/ce335d4c5aa506b2399f](https://gist.github.com/yhagio/ce335d4c5aa506b2399f)

* **Step5 - Connect-mongostore / Code Design**
* `id` and `_id` gist: [https://gist.github.com/yhagio/9702f9a9d9c54abe8352](https://gist.github.com/yhagio/9702f9a9d9c54abe8352)
* [Install connect-mongostore](https://github.com/diversario/connect-mongostore)
* Modules: Database, Routes, Passport, API Modules [https://gist.github.com/yhagio/a0df02003c75f6887fc5](https://gist.github.com/yhagio/a0df02003c75f6887fc5)
* changed from `===` to `==` and `id` to `_id` in the `/api/posts` route
```
// before
if(req.user.id === req.body.post.user)
// After
if(req.user._id == req.body.post.user)
// req.user type is object, req.body.post.user type is string
// mongo objectID
```
* Post Schema issue [https://gist.github.com/yhagio/5f41cd1f15a67c3d7053](https://gist.github.com/yhagio/5f41cd1f15a67c3d7053)
* Code organization
-- Moved User Schema
