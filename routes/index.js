var Movie = require('../models/movie');
var User = require('../models/user');
var Tag = require('../models/tag');
var crypto = require('crypto');
var multer = require('multer');
var xss = require('xss');
var sharp = require('sharp');
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
  app.get('/', function(req, res, next) {
    Movie.fetch(function(err, movies){
      if(err) {
        console.log(err);
      }
      console.log(movies);
      res.render('index', { 
        title: "首页",
        user: req.session.user,
        movies: movies,
        error: req.flash('error'),
        success: req.flash('success').toString()
      });
    });
  });

  app.get('/post', checkLogin, function(req, res) {
    res.render('post', {
      title: '发布电影',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error')
    });
  });

  app.post('/post', checkLogin, upload.single('img'), function(req, res) {
    console.log(req.file);
    req.checkBody({
      'title': {
        notEmpty: true,
        errorMessage: '请填写正确的名称'
      },
      'doctor': {
        notEmpty: true,
        errorMessage: '请输入正确的导演信息'
      },
      'players': {
        notEmpty: true,
        errorMessage: '请输入正确的主演信息'
      },
      'country': {
        notEmpty: true,
        errorMessage: '请输入正确的发行国家'
      },
      'year': {
        notEmpty: true,
        errorMessage: '请输入正确的上映日期'
      },
      'types': {
        notEmpty: true,
        errorMessage: '请选择正确的电影类型'
      },
      'summary': {
        notEmpty: true,
        errorMessage: '请输入正确的剧情简介'
      }

    });

    var errors = req.validationErrors();
    if (errors) {
      req.flash('error', errors);
      return res.redirect('/post');
    };
    if(req.file === undefined) {
      req.flash('error', {'msg': '请上传正确的海报！'});
      return res.redirect('/post');
    };
    sharp(req.file.path)
      .resize(400,400)
      .quality(70)
      .toFile(req.file.destination + '/400/' + req.file.filename , function(err) {
        if(err) throw err;
      });
    var summary = req.body.summary;
    var htmlsummary = xss(summary, {
      whiteList: [],
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
    var movieObj = {
      title: req.body.title,
      doctor: req.body.doctor,
      players: req.body.players,
      country: req.body.country,
      year: req.body.year,
      types: req.body.types,
      summary: htmlsummary,
      img: req.file.filename
    };
    console.log(req.body);
    var movie = new Movie(movieObj);
    movie.save(function(err, movie) {
      if(err) {
        console.log(err);
      }

      res.redirect('/');
    });
  });

  app.get('/movie/:id', function(req, res) {
    var id =  req.params.id;
    Movie.findById(id, function(err, movie) {
      res.render('article', {
        title: movie.title,
        user: req.session.user,
        movie: movie,
        error: req.flash('error'),
        success: req.flash('success').toString()
      });
    });
  });

  app.get('/reg', checkNotLogin,function(req, res) {
    res.render('reg', {
      title: "注册账号",
      error: req.flash('error'),
      success: req.flash('success').toString()
    });
  });

  app.post('/reg', checkNotLogin,function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var password_re = req.body['password-repeat'];
    if( password != password_re) {
      req.flash('error', {'msg': '两次输入的密码不一致！'});
      return res.redirect('/reg');
    }
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      email: email,
      password: password,
      name: req.body.name
    });
    User.findOne({email: newUser.email}, function(err, user){
      if(err) {
        console.log(err);
        return res.redirect('/');
      }
      if(user) {
        req.flash('error', {'msg': '邮箱已经存在！'});
        return res.redirect('/reg');
      }
      newUser.save(function(err, user){
        if(err) {
          console.log(err);
          return res.redirect('/reg');
        }
        req.session.user = newUser;
        req.flash('success', '注册成功');
        res.redirect('/');
      });
    });
  });

  app.get('/login', checkNotLogin,function(req,res) {
    res.render('login', {
      title: '登陆账号',
      user: req.session.user,
      error: req.flash('error'),
      success: req.flash('success').toString()
    });
  });

  app.post('/login',checkNotLogin, function(req, res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    User.findOne({email: req.body.email}, function(err, user) {
      if(!user) {
        req.flash('error', {'msg': '邮箱不存在！'});
        return res.redirect('/login');
      }
      if( user.password != password) {
        req.flash('error', {'msg': '密码错误！'});
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登陆成功');
      res.redirect('/');
    });
  });

  app.get('/logout', checkLogin, function(req, res) {
    req.session.user = null;
    req.flash('success', '登出成功！');
    res.redirect('/');
  });

  app.get('/18r/tags/add',checkLogin, function(req, res) {
    res.render('addtag', {
      title: '添加分类标签',
      error: req.flash('error'),
      success: req.flash('success').toString()
    });
  });

  app.post('/18r/tags/add', checkLogin, function(req, res) {
    var tags = req.body.tags;
    var tags_arr = tags.split(',');
    var tags_object= [];
    for(i=0;i< tags_arr.length -1; i++) {
      tags_object.push({tag: tags_arr[i]});
    }
    Tag.create(tags_object, function(err) {
      if(err) console.log(err);
      req.flash('success', '成功添加电影分类');
      res.redirect('/tags');
    });
  });

  app.get('/tags', function(req,res) {
    Tag.fetch(function(err, tags){
      if(err) {
        console.log(err);
      }
      console.log(tags);
      res.render('tags', { 
        title: "电影分类页",
        user: req.session.user,
        tags: tags,
        error: req.flash('error'),
        success: req.flash('success').toString()
      });
    });
  });

  function checkLogin(req, res, next) {
    if( !req.session.user ) {
      req.flash('error', {'msg': '未登录！'});
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if(req.session.user) {
      req.flash('error', {'msg': '已经登陆'});
      res.redirect('back');
    }
    next();
  }

}
