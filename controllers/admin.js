var Tag = require('../models/tag');
var Role = require('../models/role');
var Movie = require('../models/movie');
var redis = require("redis");
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
      title:'18r管理界面'
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
                    movies: movies
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

exports.checkRole = function(postcounts, roles) {
  for(var i=0; i< roles.length;i++) {
      if( postcounts >= roles[i].postcounts ){
        return roles[i];
      }
    }
}

