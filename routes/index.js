var Movie = require('../models/movie');
var User = require('../models/user');
var Tag = require('../models/tag');
var Resource = require('../models/resource');
var crypto = require('crypto');
var multer = require('multer');
var xss = require('xss');
var sharp = require('sharp');
var moment = require('moment');
var async = require('async');
var cache = require('express-redis-cache')({ expire: 300 });
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
    Tag.fetch(function(err, tags) {
      if(err) {
        console.log(err);
      }
      Movie.fetch(function(err, movies){
        if(err) {
          console.log(err);
        }
        res.render('index', { 
          title: "首页",
          user: req.session.user,
          tags: tags,
          movies: movies,
          error: req.flash('error'),
          success: req.flash('success').toString()
        });
      });
    });
    
  });

  app.get('/post', checkLogin, function(req, res) {
    Tag.fetch(function(err, tags) {
      res.render('post', {
        title: '发布电影',
        tags: tags,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error')
      });
    });
    
  });

  app.post('/post', checkLogin, upload.single('img'), function(req, res) {

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
        isInt: {
          options: [{ min: 1900, max: 2020 }]
        },
        errorMessage: '请输入正确的上映年份'
      },
      'types': {
        notEmpty: true,
        errorMessage: '请选择正确的电影类型'
      },
      'summary': {
        notEmpty: true,
        errorMessage: '请输入正确的剧情简介'
      },
      'resources': {
        notEmpty: true,
        errorMessage: '请务必输入下载资源'
      }

    });
    console.log(req.body);
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
    var user= req.session.user;
    var movieObj = {
      title: req.body.title,
      doctor: req.body.doctor,
      players: req.body.players,
      country: req.body.country,
      year: req.body.year,
      types: req.body.types,
      summary: htmlsummary,
      img: req.file.filename,
      creator: user._id
    };
    var resources_id;
    if( Array.isArray( req.body.resources) ){
      for(var i=0; i<req.body.resources.length;i++){
        
      }
       var resources = new Resource({
        resource: req.body.resources,
        creator: req.session.user._id,
       })
    }
    else{
      console.log('资源不是数组');
    }
    var movie = new Movie(movieObj);
    movie.save(function(err, movie) {
      if(err) {
        console.log(err);
      }
      User.findById(user._id, function(err, user) {
        user.movies.push(movie);
        user.save(function(err){
          if(err) {
            console.log(err);
          }
        });
      });
      res.redirect('/');
    });
  });

  app.get('/movie/:id', pvadd, cache.route(), function(req, res) {
    var id =  req.params.id;
    async.parallel({
      tags: function(callback) {
        Tag.fetch(function(err, tags) {
          callback(null, tags);
       });
      },
      movie: function(callback) {
        Movie.findById(id, function(err, movie) {
          callback(null,movie);
        });
      }
      },
        function(err, results) {
          var title = results.movie.title + '_迅雷下载,百度云,360云,电驴,磁力链接'
          var pubdate = moment(results.movie.meta.createAt).format('YYYY-MM-DD HH:mm:ss');
          var tags = results.tags;
          var movie = results.movie;
          res.render('article', {
              title: title,
              user: req.session.user,
              pubdate: pubdate,
              tags: tags,
              movie: movie,
              error: req.flash('error'),
              success: req.flash('success').toString()
          });
        }
      );
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
    var signature  = req.body.signature ;
    var avatar = req.body.avatar;
    if( password != password_re) {
      req.flash('error', {'msg': '两次输入的密码不一致！'});
      return res.redirect('/reg');
    }
    req.checkBody({
      'email': {
        notEmpty: true,
        isEmail: {
          errorMessage: '必须填写正确邮箱地址'
        },
        errorMessage: '邮箱地址不能为空'
      },
      'password': {
        notEmpty: true,
        isLength: {
          options:  [{ min: 6, max: 15}],
          errorMessage: '密码必须介于6到15个字符之间'
        },
        errorMessage: '请填写正确的密码'
      },
      'name': {
        notEmpty: true,
        errorMessage: '请填写昵称'
      },
      'avatar': {
        notEmpty: true,
        isInt: {
          options: [{ min: 1, max: 16 }],
          errorMessage: '请选择头像'
        },
        errorMessage: '请选择正确的头像'
      },
      'signature': {
        notEmpty: true,
        isLength: {
          options: [{ min: 10, max: 50}],
          errorMessage: '请填写10到50个字符之间的个人简介'
        },
        errorMessage: '请填写正确的个人简介'
      }

    });
    var errors = req.validationErrors();
    if (errors) {
      req.flash('error', errors);
      return res.redirect('/reg');
    };
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      email: email,
      password: password,
      name: req.body.name,
      signature: signature,
      avatar: avatar
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
      res.render('tags', { 
        title: "电影分类页",
        user: req.session.user,
        tags: tags,
        error: req.flash('error'),
        success: req.flash('success').toString()
      });
    });
  });
 
 app.get('/tag/:id', cache.route(), function(req, res) {
    var typeid = req.params.id;
    Tag.fetch(function(err, tags) {
      Movie.find({types: typeid })
                  .sort('-meta.updateAt')
                  .populate('types', 'tag _id')
                  .exec(function(err, movies){
                    if(err) {
                      console.log(err);
                    }
                    var tagname;
                    for(var i=0; i<tags.length;i++){
                      if(tags[i]._id == typeid){
                          tagname= tags[i].tag;
                      }
                    }
                    res.render('tag', {
                      title: tagname+'电影大全_迅雷下载,百度云,电驴,磁力链接,种子',
                      tagname: tagname,
                      user: req.session.user,
                      tags: tags,
                      error: req.flash('error'),
                      movies: movies,
                      success: req.flash('success').toString()
                    });
                  });
    });
    
   });
  app.get('/user/:id', cache.route(), function(req, res){
    var id = req.params.id;
    User.findById( id, function(err, user) {
        Movie.find({creator: id})
                    .sort('-meta.updateAt')
                    .populate('types', 'tag _id')
                    .exec(function(err, movies){
                      if(err) {
                        console.log(err);
                      }
                       res.render('user', {
                          title: user.name+'个人页面,'+ user.name+'发布的电影',
                          error: req.flash('error'),
                          success: req.flash('success').toString(),
                          user: req.session.user,
                          visituser: user,
                          movies: movies
                       });
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

  function pvadd(req, res, next) {
     var id = req.params.id;
     Movie.findByIdAndUpdate(id, {$inc: {pv: 1}}, function(err) {
            if(err) console.log(err);
        });
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
