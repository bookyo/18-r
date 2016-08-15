$(function() {
  $('.del').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    $.ajax({
      type: 'DELETE',
      url: '/18r/movie/delete?id=' + id
    })
    .done(function(results) {
      window.location = '/18r/movies';
    });
  });
  $('.tagdel').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    $.ajax({
      type: 'DELETE',
      url: '/18r/tag/delete?id=' + id
    })
    .done(function(results) {
      window.location= '/18r/tags';
    });
  });
});