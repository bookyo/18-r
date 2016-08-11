var User = require('../models/user');
var crypto = require('crypto');
var Movie = require('../models/movie');
var adminController = require('./admin');
exports.getreg = function(req, res) {
    res.render('reg', {
      title: "注册账号",
      error: req.flash('error'),
      success: req.flash('success').toString()
    });
  }

 exports.postreg =  function(req, res) {
    var email = req.sanitize('email').trim().toLowerCase();
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
    var role = adminController.checkRole(0, req.roles);
    var newUser = new User({
      email: email,
      password: password,
      name: req.body.name,
      signature: signature,
      role: role,
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
  }

  exports.getlogin = function(req,res) {
    res.render('login', {
      title: '登陆账号',
      user: req.session.user,
      error: req.flash('error'),
      success: req.flash('success').toString()
    });
  }

  exports.postlogin = function(req, res) {
    var md5 = crypto.createHash('md5');
    var email = req.sanitize('email').trim().toLowerCase();
    var password = md5.update(req.body.password).digest('hex');
    User.findOne({email: email})
             .populate('role')
             .exec(function(err, user) {
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
  }

  exports.logout = function(req, res) {
    req.session.user = null;
    req.flash('success', '登出成功！');
    res.redirect('/');
  }

  exports.getUser = function(req, res){
    var id = req.params.id;
    User.findById( id, function(err, user) {
        var perPage = 16;
        var page = req.query.page > 0 ? req.query.page : 1;
        Movie
          .find({creator: id})
          .select('title _id doctor players types img')
          .populate('types', '_id tag')
          .limit(perPage)
          .skip(perPage * (page-1))
          .sort('-meta.updateAt')
          .exec( function(err, movies) {
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
  }