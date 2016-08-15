var Tag = require('../models/tag');
var Role = require('../models/role');
var Movie = require('../models/movie');
var redis = require("redis");
var xss = require('xss');
var client = redis.createClient();

exports.getaddtags = function(req, res) {
    res.render('addtag', {
      title: '添加分类标签',
      error: req.flash('error'),
      success: req.flash('success').toString()
    });
  }

  exports.postaddtags = function(req, res) {
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
  }

  exports.getaddroles = function(req, res) {
  	res.render('addroles', {
          title: '添加用户组',
          error: req.flash('error'),
          success: req.flash('success').toString()
         });
  }

  exports.postaddroles = function(req, res) {
     var roleObj= {
        role: req.body.role,
        postcounts: req.body.postcounts,
        limitview: req.body.limitview,
        limitposts: req.body.limitposts,
        isexam: req.body.isexam,
        canaddres: req.body.canaddres
     }
     var role = new Role(roleObj);
     role.save( function(err, role) {
       console.log(role);
       req.flash('success', '成功添加用户组');
       res.redirect('back');
     });
  }

  exports.getadmin = function(req, res) {
    res.render('admin', {
      title:'18r管理界面',
      user: req.session.user
    });
  }

  exports.getmovies= function(req, res) {
    Movie.find()
                .where("review").lt(3)
                .populate('types','_id tag')
                .populate('creator', '_id name avatar')
                .populate('resources')
                .exec(function(err,movies) {
                  if(err) console.log(err);
                   res.render('adminmovies', {
                    title: '审核中或者前台删除的电影列表',
                    movies: movies,
                    user: req.session.user
                   });
                });
  }

  exports.getmovieedit = function(req, res) {
    var id = req.params.id;
    Movie.findOne({_id: id})
                .exec( function(err, movie) {
                  res.render('movieedit', {
                    title: '修改' + movie.title,
                    movie: movie,
                    tags: req.tags,
                    user: req.session.user
                  });
                });
  }
  exports.delete = function(req, res) {
    var id = req.query.id;

    if(id) {
      Movie.remove({_id: id})
                  .exec(function(err, movie){
                    if(err){
                      console.log(err);
                      res.json({success: 0});
                    }else {
                      res.json({success: 1});
                    }
                  });
    }
  }
  exports.postmovieedit = function(req, res) {
    var id = req.params.id;
    var title = req.body.title;
    var doctor = req.body.doctor;
    var players = req.body.players;
    var country = req.body.country;
    var year = req.body.year;
    var types =  req.body.types;
    var img;
    console.log(req.body);
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
      }

    });
    var errors = req.validationErrors();
    if (errors) {
      return res.redirect('back');
    };
    if(req.file === undefined) {
      img = req.body.eimg;
    }else{
      sharp(req.file.path)
        .resize(400,400)
        .quality(70)
        .toFile(req.file.destination + '/400/' + req.file.filename , function(err) {
          if(err) throw err;
        });
        img = req.file.filename;
    }
    var summary = req.body.summary;
    var htmlsummary = xss(summary, {
      whiteList: [],
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
    Movie.findOne({_id: id})
                .exec(function(err, movie){
                  movie.title = title;
                  movie.doctor = doctor;
                  movie.players = players;
                  movie.country = country;
                  movie.review = 3;
                  movie.year = year;
                  movie.types = types;
                  movie.img = img;
                  movie.summary = htmlsummary;
                  movie.save(function(err, movie) {
                    if(err) {
                      console.log(err);
                    }
                    res.redirect('/18r/movies' );
                  });
                });
  }

exports.gettags = function(req, res) {
  Tag.find()
         .exec(function(err, tags) {
          if(err) {
            console.log(err);
          }
          res.render('admintags', {
            title: '后台标签分类管理',
            tags: tags,
            user: req.session.user
          });
         });
}
exports.tagdel = function(req, res) {
    var id = req.query.id;

    if(id) {
      Tag.remove({_id: id})
                  .exec(function(err, tag){
                    if(err){
                      console.log(err);
                      res.json({success: 0});
                    }else {
                      res.json({success: 1});
                    }
                  });
    }
}
exports.rolesByRedis = function(req, res, next) {
  getRolesFromRedis(function(err, roles) {
    if(err) return next(err);

    if(!roles) {
      getRolesFromMongo( function(err, roles) {
        if(err) return next(err);
        if(!roles) {
          return next(new Error('Roles not found'));
        }
        req.roles = roles;
        return next();
      });
    } else {
      req.roles = roles;
      return next();
    }
  });
}

function getRolesFromMongo(cb) {
  Role
    .find({})
    .sort('-postcounts')
    .exec(function(err, roles) {
                if(roles) {
                  client.set('roles', JSON.stringify(roles));
                }
      return cb(err, roles);
    });
}

function getRolesFromRedis(cb) {
  client.get('roles', function(err, roles) {
    if(err) return cb(err, null);
    try {
      roles = JSON.parse(roles);
    } catch(e) {
      return cb(e, null);
    }
    return cb(err, roles);
  });
}

exports.isAdmin = function(req, res, next){
  if(req.session.user.isadmin) {
    next();
  }else{
    req.flash('error', {'msg': '对不起，您不是管理员'});
    return res.redirect('/');
  }
}

exports.checkRole = function(postcounts, roles) {
  for(var i=0; i< roles.length;i++) {
      if( postcounts >= roles[i].postcounts ){
        return roles[i];
      }
    }
}

