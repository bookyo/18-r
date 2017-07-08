$(function() {
  $('.del').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    $.ajax({
      type: 'DELETE',
      url: '/movie/delete?id=' + id
    })
    .done(function(results) {
      window.location = '/';
    });
  });
  $('.resdel').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    var movieid = target.data('movieid');
    $.ajax({
      type: 'DELETE',
      url: '/18r/res/delete?id=' + id + '&movieid=' + movieid
    })
    .done(function(results) {
      window.location= '/movie/'+movieid;
    });
  });
  $('.deltopic').click(function(e) {
   var target = $(e.target);
   var id = target.data('id');
   $.ajax({
     type: 'DELETE',
     url: '/topic/delete?id=' + id
   })
   .done(function(results) {
    window.location = '/topics';
   });
 });
 $('.del-notice').click(function(e) {
  var target = $(e.target);
  var id = target.data('id');
  $.ajax({
    type: 'DELETE',
    url: '/notice/delete?id=' + id
  })
  .done(function(results) {
    window.location = '/';
  })
 });
});