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

  app.get('/post', checkLogin,  Tagcontroller.tagsByRedis, MovieController.new);

  app.post('/post', checkLogin, AdminController.rolesByRedis, upload.single('img'), MovieController.post);

  app.get('/movie/:id', Tagcontroller.tagsByRedis,MovieController.getMovie );
  app.delete('/movie/delete', checkLogin, MovieController.delete);
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


  app.get('/18r/tags/add',checkLogin, AdminController.getaddtags);

  app.post('/18r/tags/add', checkLogin, AdminController.postaddtags);
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
