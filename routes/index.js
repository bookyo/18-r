var Movie = require('../models/movie');
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
      req.flash('error', '海报图片类型错误！');
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
        movies: movies
      });
    });
  });

  app.get('/post', function(req, res) {
    res.render('post', {
      title: '发布电影',
      success: req.flash('success').toString(),
      error: req.flash('error')
    });
  });

  app.post('/post',  upload.single('img'), function(req, res) {
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
    if(!req.file) {
      req.flash('error', {'msg': '请上传正确的海报！'});
      return res.redirect('/post');
    };
    var movieObj = {
      title: req.body.title,
      doctor: req.body.doctor,
      players: req.body.players,
      country: req.body.country,
      year: req.body.year,
      types: req.body.types,
      summary: req.body.summary,
      img: req.body.img
    };
    console.log(req.body);
    var movie = new Movie(movieObj);
    movie.save(function(err, movie) {
      if(err) {
        console.log(err);
      }

      // res.redirect('/');
    });
  });

}
