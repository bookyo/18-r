var compression = require('compression');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var mongoose = require('mongoose');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ueditor = require('ueditor');
var session = require('express-session');
var flash = require('connect-flash');
var expressValidator = require('express-validator');

var MongoStore = require('connect-mongo')(session);
var routes = require('./routes/index');
var config = require('./config/db');
var Notice = require('./models/notice');
var User = require('./models/user');
var Category = require('./models/category');
// var qiniu = require('./config/qiniu'); #千牛CDN

var app = express();
app.use(compression());
mongoose.connect('mongodb://127.0.0.1/bted2k', config);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/ueditor/ue', ueditor(path.join(__dirname, 'public'), function(req, res, next) {
  var imgDir = '/imgs';
  var ActionType = req.query.action;
  if(ActionType === 'uploadimage' ) {
    res.ue_up(imgDir);
  }
  else if (ActionType === 'listimage') {
    res.ue_list(imgDir);
  }
  else {
    res.setHeader('Content-Type', 'application/json');
    res.redirect('/ueditor/ueditor.config.json')
  }
}));

app.use(session({
  secret: "rmovie18-cctv-qu",
  resave: true,
  saveUninitialized: false,
  key: "movie",
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30day
  store: new MongoStore({
    url: 'mongodb://bted2k:bted2k@127.0.0.1/bted2k'
  })
}));

app.use(function(req, res, next) {
  Notice.getNoticesByRedis(function(err, notices) {
    res.locals.notices = notices;
  });
  User.getRanksByRedis(function(err, ranks) {
    res.locals.userranks = ranks;
  });
  Category.getCategoriesByRedis(function(err, categories) {
    app.locals.categories = categories;
  });
  // res.locals.cdnhost = qiniu.host;  #千牛CDN
  res.locals.createPagination = function (pages, page) {
    var url = require('url')
      , qs = require('querystring')
      , params = qs.parse(url.parse(req.url).query)
      , str = ''
      , list_len = 2
      , total_list = list_len * 2 +1
      , j = 1
      , pageNo = parseInt(page);
    if(pageNo >= total_list) {
       j = pageNo - list_len;
       total_list = pageNo + list_len;
       if(total_list > pages) {
          total_list = pages;
       }
    }
    else {
      j = 1;
      if( total_list > pages) {
        total_list = pages;
      }
    }
    params.page = 0
    for(j; j<=total_list; j++) {
      params.page = j
      clas = pageNo == j ? "active" : "no"
       str += '<li class="'+clas+'"><a href="?'+qs.stringify(params)+'">'+ j +'</a></li>'
    }
    return str
  }
  next();
});

app.use(flash());
routes(app);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
