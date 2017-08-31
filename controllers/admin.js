var Tag = require('../models/tag');
var Role = require('../models/role');
var Movie = require('../models/movie');
var Resource = require('../models/resource');
var User = require('../models/user');
var UserBuyMovie = require('../models/userbuymovie');
var redis = require("redis");
var xss = require('xss');
var client = redis.createClient();

exports.getaddtags = function(req, res) {
    res.render('addtag', {
      error: req.flash('error'),
      success: req.flash('success').toString()
    });
  }

  exports.postaddtags = function(req, res) {
    var tags = req.body.tags;
    var tags_arr = tags.split(',');
    var tags_object= [];
    for(i=0;i< tags_arr.length; i++) {
      tags_object.push({tag: tags_arr[i]});
    }
    Tag.create(tags_object, function(err) {
      if(err) console.log(err);
      client.del('tags');
      res.redirect('/18r/tags');
    });
  }

  exports.getaddroles = function(req, res) {
  	res.render('addroles', {
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
       client.del('roles');
       req.flash('success', '成功添加用户组');
       res.redirect('back');
     });
  }

  exports.getadmin = function(req, res) {
    res.render('admin', {
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
                    movie: movie,
                    tags: req.tags,
                    user: req.session.user
                  });
                });
  }
  exports.delete = function(req, res) {
    var id = req.query.id;

    if(id) {
      Movie.findOne({_id:id})
                  .exec(function(err, movie) {
                    exports.addCounts(movie.creator, -3, req.roles);
                    Resource.remove({_id:{ $in: movie.resources}}, function(err) {
                      if(err) {
                        console.log(err);
                      }
                    });
                    movie.remove(function(err) {
                      if(err) {
                        console.log(err);
                        res.json({success: 0});
                      }
                      res.json({success: 1});
                    });
                  })
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
    var review = req.body.review;
    var img;
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
              .populate('creator', '_id postcounts')
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
                    if(movie.creator.postcounts < 13){
                      if(review==1){
                        exports.addCounts(movie.creator._id, 10, req.roles);
                      }
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
exports.resdel = function(req, res) {
    var id = req.query.id;
    var movieid = req.query.movieid;
    if(movieid!= 'undefined') {
      Movie.findOne({_id: movieid})
                  .exec(function(err, movie) {
                    if(err) {
                      console.log(err);
                    }
                    for(var i=0; i< movie.resources.length; i++){
                      if( movie.resources[i] == id) {
                        movie.resources.splice(i, 1);
                        break;
                      }
                    }
                    movie.save(function(err){
                      if(err){
                        console.log(err);
                      }
                    });
                  });
    }
    if(id) {
      Resource.findOne({_id:id})
                        .exec(function(err, resource) {
                          if(err) {
                            console.log(err);
                            res.json({success: 0});
                          }
                          exports.addCounts(resource.creator, -1, req.roles);
                          resource.remove(function(err) {
                            if(err) {
                              console.log(err);
                            };
                            res.json({success: 1});
                          });
                        });
    }
}
exports.getresources = function(req, res) {
    var perPage = 30;
    var page = req.query.page > 0 ? req.query.page : 1;
    Resource
      .find()
      .populate('creator', '_id name')
      .populate('tomovie', '_id title')
      .limit(perPage)
      .skip(perPage * (page-1))
      .sort('-meta.updateAt')
      .exec( function(err, resources) {
         if(err) {
           console.log(err);
         }
         Resource.count(function(err, count) {
            res.render('adminres', {
              user: req.session.user,
              resources: resources,
              page: page,
              pages: Math.ceil(count/perPage)
            });
         });
       });
}

exports.getusers = function(req, res) {
        res.render('adminusers', {
          user: req.session.user,
          success: req.flash('success').toString()
        });
}

exports.searchusers = function(req, res) {
  var id = req.body.user
  var myreg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
  if(!myreg.test(id)){
    User.findOne({_id: id})
             .populate('role')
             .exec(function(err, user) {
                res.render('adminusers', {
                  user:req.session.user,
                  resultuser: user
                });
             });
  } else {
    User.findOne({email: id})
            .populate('role')
            .exec(function(err, user) {
              res.render('adminusers', {
                user: req.session.user,
                resultuser: user
              });
            });
  }
  

}

exports.edituser = function(req, res) {
  var id = req.params.id;
  User.findOne({_id: id})
           .populate('role')
           .exec(function(err, user) {
              res.render('adminedituser', {
                user: req.session.user,
                edituser: user
              });
           });
}

exports.postuser = function(req, res) {
  var id = req.body.id;
  var name = req.body.name;
  var signature = req.body.signature;
  var email = req.body.email;
  var postcounts = req.body.postcounts;
  User.findOne({_id: id})
          .populate('role')
          .exec(function(err, user){
            user.name = name;
            user.signature= signature;
            user.email = email;
            user.postcounts = postcounts;
            var role = exports.checkRole(user.postcounts, req.roles);
            user.role = role;
            user.save(function(err, user){
              if(err) {
                console.log(err);
              }
              res.redirect('/18r/users');
            });
          });
}

exports.deletzerousers = function(req, res) {
  User.remove({postcounts: 0})
          .exec(function(err, users) {
            if(err){
              console.log(err);
              res.json({success: 0});
            }else {
              req.flash('success', '已删除积分为0的用户！');
              res.json({success: 1});
            }
          })

}

exports.getroles = function(req, res){
  Role.find()
          .exec(function(err, roles){
            res.render('adminroles', {
              roles: roles,
              user: req.session.user
            });
          });
}
exports.getroleedit = function(req, res) {
  var id = req.params.id;
  Role.findOne({_id: id})
          .exec(function(err, role) {
            res.render('editrole', {
              role: role,
              user: req.session.user
            });
          });
}
exports.postroleedit = function(req, res) {
  var id = req.params.id;
  var therole = req.body.role;
  var postcounts = req.body.postcounts;
  var limitview =req.body.limitview;
  var isexam = req.body.isexam;
  var limitposts = req.body.limitposts;
  var canaddres = req.body.canaddres;
  Role.findOne({_id: id})
          .exec(function(err, role){
            role.role = therole;
            role.postcounts = postcounts;
            role.limitview = limitview;
            role.isexam = isexam;
            role.limitposts = limitposts;
            role.canaddres = canaddres;
            role.save(function(err, role){
              if (err) {
                console.log(err);
              }
              client.del('roles');
              res.redirect('/18r/roles');
            });
          });
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

exports.canaddres = function(req, res, next) {
  if(req.session.user.isadmin || req.session.user.role.canaddres) {
    next();
  } else {
    req.flash('error', {'msg': '对不起，您所在用户组不能添加电影资源或者创建专题！'});
    return res.redirect('back');
  }
}

exports.checkLimitView = function(req, res, next) {
    if (req.session.user.isadmin) {
      return next();
    }
    var now = new Date();
    var day = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    var start = new Date(day);
    User.findOne({_id: req.session.user._id})
            .select('_id role')
            .populate('role', 'limitview')
            .exec(function(err, user) {
              if(err) {
                console.log(err);
              }
              if(!user) {
                req.flash('error', {'msg': '对不起，没有找到对应用户！'});
                return res.redirect('back');
              }
              UserBuyMovie.find({userid: user._id})
                                      .where('createAt').gt(start)
                                      .count(function(err, count) {
                                        if(err) {
                                          console.log(err);
                                        }
                                        if(count >= user.role.limitview) {
                                          req.flash('error', {'msg': '对不起，您所在用户组每天只能查看' + user.role.limitview + '个电影资源!'});
                                          return res.redirect('back')
                                        }
                                        next();
                                      })
            })
  }

exports.checkRole = function(postcounts, roles) {
  for(var i=0; i< roles.length;i++) {
      if( postcounts >= roles[i].postcounts ){
        return roles[i];
      }
    }
}

exports.addCounts = function(userid, counts, roles) {
  User.findOne({_id: userid})
           .populate('role')
           .exec(function(err, user) {
                      user.postcounts = user.postcounts + counts;
                      if(user.postcounts < 0) {
                        user.postcounts = 0;
                      }
                      var role = exports.checkRole(user.postcounts, roles);
                      user.role = role;
                      user.save(function(err, user) {
                        
                        if(err){
                          console.log(err);
                        }
                      });
                    });
}



