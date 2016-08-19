var MovieController = require('../controllers/movie');
var IndexController = require('../controllers/index');
var UserController = require('../controllers/user');
var AdminController = require('../controllers/admin');
var Tagcontroller = require('../controllers/tag');
var ResourceController = require('../controllers/resource');
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function(req, file, cb) {
    var fileFormat = (file.originalname).split(".");
    cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length -1]);
  }
});
var upload = multer({ 
  storage: storage,
  fileFilter: function(req, file, cb) {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg'){
      cb(null, false);
    }
    else{
      cb(null,true);
    }
  }
});
/* GET home page. */
module.exports = function(app) {
  app.get('/', Tagcontroller.tagsByRedis, IndexController.index);

  app.get('/post', checkLogin,  Tagcontroller.tagsByRedis, AdminController.rolesByRedis, MovieController.checkLimitPost, MovieController.new);

  app.post('/post', checkLogin, AdminController.rolesByRedis, MovieController.checkLimitPost, upload.single('img'), MovieController.post);

  app.get('/movie/:id', Tagcontroller.tagsByRedis,MovieController.getMovie );
  app.delete('/movie/delete', checkLogin, AdminController.isAdmin, MovieController.delete);
  app.get('/movie/:id/update', checkLogin,Tagcontroller.tagsByRedis,MovieController.getupdate);
  app.post('/movie/:id/update', checkLogin, upload.single('img'),  MovieController.postupdate);

  app.get('/resource/:id/add', checkLogin, ResourceController.getadd);
  app.post('/resource/:id/add', checkLogin, ResourceController.postadd);
  

  app.get('/reg', checkNotLogin,UserController.getreg);

  app.post('/reg', checkNotLogin, AdminController.rolesByRedis, UserController.postreg);

  app.get('/login', checkNotLogin,UserController.getlogin);

  app.post('/login',checkNotLogin, UserController.postlogin);

  app.get('/logout', checkLogin, UserController.logout);
  
  app.get('/user/:id', UserController.getUser);

  app.get('/18r', checkLogin,AdminController.isAdmin, AdminController.getadmin);
  app.get('/18r/movies', checkLogin,AdminController.isAdmin, AdminController.getmovies);
  app.get('/18r/movie/:id/edit',  checkLogin,AdminController.isAdmin, Tagcontroller.tagsByRedis,AdminController.getmovieedit);
  app.post('/18r/movie/:id/edit', checkLogin,AdminController.isAdmin, upload.single('img'),  AdminController.postmovieedit);
  app.delete('/18r/movie/delete', checkLogin, AdminController.isAdmin, AdminController.delete);
  app.get('/18r/tags',checkLogin, AdminController.isAdmin, AdminController.gettags);
  app.get('/18r/tags/add',checkLogin, AdminController.isAdmin, AdminController.getaddtags);
  app.delete('/18r/tag/delete', checkLogin, AdminController.isAdmin, AdminController.tagdel);
  app.post('/18r/tags/add', checkLogin, AdminController.isAdmin, AdminController.postaddtags);
  app.get('/18r/res', checkLogin, AdminController.isAdmin, AdminController.getresources);
  app.delete('/18r/res/delete',checkLogin, AdminController.isAdmin, AdminController.resdel);
  app.get('/18r/users', checkLogin, AdminController.isAdmin, AdminController.getusers);
  app.post('/18r/users', checkLogin, AdminController.isAdmin, AdminController.searchusers);
  app.get('/18r/user/:id/edit', checkLogin, AdminController.isAdmin, AdminController.editusers);
  app.get('/18r/roles/add', checkLogin, AdminController.getaddroles);
  app.post('/18r/roles/add', checkLogin, AdminController.postaddroles);

  app.get('/tags', Tagcontroller.tagsByRedis,Tagcontroller.gettags);
 
 app.get('/tag/:id', Tagcontroller.tagsByRedis,Tagcontroller.gettag);

  function checkLogin(req, res, next) {
    if( !req.session.user ) {
      req.flash('error', {'msg': '未登录！'});
      return res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if(req.session.user) {
      req.flash('error', {'msg': '已经登陆'});
       return res.redirect('back');
    }
    next();
  }



}
