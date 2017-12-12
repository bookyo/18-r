var MovieController = require('../controllers/movie');
var IndexController = require('../controllers/index');
var UserController = require('../controllers/user');
var AdminController = require('../controllers/admin');
var Tagcontroller = require('../controllers/tag');
var ResourceController = require('../controllers/resource');
var TopicController = require('../controllers/topic');
var NoticeController = require('../controllers/notice');
var ImgController = require('../controllers/image');
var JiexiController = require('../controllers/jiexi');
var multer = require('multer');
var csrf = require('csurf');
var csrfProtection = csrf();
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
  app.get('/', Tagcontroller.tagsByRedis, MovieController.hotsByRedis, IndexController.index);

  app.get('/post', checkLogin, Tagcontroller.tagsByRedis, AdminController.rolesByRedis, MovieController.checkLimitPost, MovieController.new);

  app.post('/post', checkLogin, AdminController.rolesByRedis, MovieController.checkLimitPost, upload.single('img'), MovieController.post);

  app.get('/movie/:id', csrfProtection, Tagcontroller.tagsByRedis,MovieController.hotsByRedis,MovieController.getMovie );
  app.get('/mip/movie/:id', csrfProtection, Tagcontroller.tagsByRedis, MovieController.hotsByRedis, MovieController.getMovie);
  app.delete('/movie/delete', checkLogin, AdminController.isAdmin, MovieController.delete);
  app.get('/movie/:id/update', checkLogin,AdminController.isAdmin, Tagcontroller.tagsByRedis,MovieController.getupdate);
  app.post('/movie/:id/update', checkLogin, AdminController.isAdmin, upload.single('img'),  MovieController.postupdate);
  app.get('/movie/:id/uploadimgs', checkLogin, ImgController.getupload);
  app.post('/uploadimgs', checkLogin, AdminController.canaddres, upload.array('imgs',8), ImgController.postupload);
  app.get('/movie/:id/images', ImgController.getimages);
  app.delete('/image/del',checkLogin, AdminController.isAdmin, ImgController.delimage);
  app.get('/hots', MovieController.hotsByRedis, MovieController.gethots);
  app.get('/resource/:id/add', checkLogin, AdminController.canaddres,ResourceController.getadd);
  app.post('/resource/:id/add', checkLogin, AdminController.canaddres, AdminController.rolesByRedis, ResourceController.postadd);
  app.post('/movie/buy', csrfProtection, checkLogin, AdminController.checkLimitView, ResourceController.buymovie);
  
  app.get('/reg', checkNotLogin,UserController.getreg);

  app.post('/reg', checkNotLogin, AdminController.rolesByRedis, UserController.postreg);

  app.get('/login', checkNotLogin,UserController.getlogin);

  app.post('/login',checkNotLogin, UserController.postlogin);

  app.get('/logout', checkLogin, AdminController.rolesByRedis, UserController.logout);
  app.get('/user/goup', checkLogin, AdminController.rolesByRedis, UserController.goup);
  app.get('/user/:id', UserController.getUser);
  app.get('/user/do/edit', checkLogin, UserController.getedit);
  app.post('/user/do/edit', checkLogin, UserController.postedit);

  app.get('/18r', checkLogin,AdminController.isAdmin, AdminController.getadmin);
  app.get('/18r/movies', checkLogin,AdminController.isAdmin, AdminController.getmovies);
  app.get('/18r/movie/:id/edit',  checkLogin,AdminController.isAdmin, Tagcontroller.tagsByRedis,AdminController.getmovieedit);
  app.post('/18r/movie/:id/edit', checkLogin,AdminController.isAdmin, AdminController.rolesByRedis, upload.single('img'),  AdminController.postmovieedit);
  app.delete('/18r/movie/delete', checkLogin, AdminController.isAdmin, AdminController.rolesByRedis,AdminController.delete);
  app.get('/18r/tags',checkLogin, AdminController.isAdmin, AdminController.gettags);
  app.get('/18r/tags/add',checkLogin, AdminController.isAdmin, AdminController.getaddtags);
  app.delete('/18r/tag/delete', checkLogin, AdminController.isAdmin, AdminController.tagdel);
  app.post('/18r/tags/add', checkLogin, AdminController.isAdmin, AdminController.postaddtags);
  app.get('/18r/res', checkLogin, AdminController.isAdmin, AdminController.getresources);
  app.delete('/18r/res/delete',checkLogin, AdminController.isAdmin, AdminController.rolesByRedis, AdminController.resdel);
  app.get('/18r/users', checkLogin, AdminController.isAdmin, AdminController.getusers);
  app.post('/18r/users', checkLogin, AdminController.isAdmin, AdminController.searchusers);
  app.get('/18r/user/:id/edit', checkLogin, AdminController.isAdmin, AdminController.edituser);
  app.post('/18r/user/:id/edit', checkLogin, AdminController.isAdmin, AdminController.rolesByRedis, AdminController.postuser);
  app.delete('/18r/users/deletezerousers', checkLogin, AdminController.isAdmin, AdminController.deletzerousers);
  app.get('/18r/roles/add', checkLogin, AdminController.isAdmin, AdminController.getaddroles);
  app.post('/18r/roles/add', checkLogin, AdminController.isAdmin, AdminController.postaddroles);
  app.get('/18r/roles', checkLogin, AdminController.isAdmin,AdminController.getroles);
  app.get('/18r/role/:id/edit', checkLogin, AdminController.isAdmin,AdminController.getroleedit);
  app.post('/18r/role/:id/edit',checkLogin, AdminController.isAdmin,AdminController.postroleedit);
  app.get('/18r/categories', checkLogin, AdminController.isAdmin, AdminController.getcategories);
  app.get('/18r/category/add', checkLogin, AdminController.isAdmin, AdminController.addcategory);
  app.post('/18r/category/add', checkLogin, AdminController.isAdmin, AdminController.postaddcategory);
  app.delete('/18r/category/delete', checkLogin, AdminController.isAdmin, AdminController.delcategory);
  app.get('/18r/images', checkLogin, AdminController.isAdmin, AdminController.getimages);

  app.get('/tags', Tagcontroller.tagsByRedis,Tagcontroller.gettags);
 
  app.get('/tag/:id', Tagcontroller.tagsByRedis,MovieController.hotsByRedis,Tagcontroller.gettag);
  app.get('/year/:year', Tagcontroller.tagsByRedis, MovieController.getbyyear);
  app.get('/country/:country', Tagcontroller.tagsByRedis, MovieController.getbycountry);

  app.get('/topics', TopicController.topicsByRedis,  TopicController.getTopics);
  app.get('/topic/new', checkLogin, AdminController.canaddres, TopicController.getNew);
  app.post('/topic/new', checkLogin, AdminController.canaddres, TopicController.postNew);
  app.get('/topic/:id', TopicController.topicsByRedis, TopicController.getTopic);
  app.get('/topic/:id/update', checkLogin, TopicController.editTopic);
  app.post('/topic/:id/update', checkLogin, TopicController.updateTopic);
  app.delete('/topic/delete', checkLogin, AdminController.isAdmin, TopicController.delete);
  app.delete('/topic/delmovie', checkLogin, TopicController.delmovie);
  app.post('/topic/addmovie', checkLogin, TopicController.addmovie);
  app.get('/topic/:id/addmovie', checkLogin, TopicController.addmoviebyid);
  app.post('/topic/:id/addmovie', checkLogin, TopicController.postaddmovie);

  app.post('/movie/search', checkLogin, MovieController.search);
  app.get('/search', checkLogin, Tagcontroller.tagsByRedis,  UserController.search);

  app.get('/notice/add', checkLogin, AdminController.isAdmin, NoticeController.getadd);
  app.post('/notice/add', checkLogin, AdminController.isAdmin, NoticeController.postadd);
  app.get('/notice/:id', Tagcontroller.tagsByRedis, MovieController.hotsByRedis, NoticeController.getnotice);
  app.get('/notice/:id/update', checkLogin, AdminController.isAdmin, NoticeController.getupdate);
  app.post('/notice/:id/update', checkLogin, AdminController.isAdmin, NoticeController.postupdate);
  app.delete('/notice/delete', checkLogin, AdminController.isAdmin, NoticeController.delete);
  
  app.get('/play/:id', csrfProtection, Tagcontroller.tagsByRedis, MovieController.hotsByRedis, MovieController.play);
  app.get('/xfplay/:id', Tagcontroller.tagsByRedis, MovieController.hotsByRedis, MovieController.xfplay);
  app.get('/userranks', Tagcontroller.tagsByRedis,MovieController.hotsByRedis, UserController.userranks);
  app.get('/api', JiexiController.jiexi);
  
  app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    // handle CSRF token errors here
    res.status(403);
    req.flash('error',{'msg':'参数错误或者重复提交！'});
    res.redirect('back');
  });
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
