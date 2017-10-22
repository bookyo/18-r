$(function() {
  var uploadbutton = $('.btn-uploadimgs');
  uploadbutton.click(function(e) {
      e.preventDefault();
      uploadbutton.attr('disabled','disabled');
      uploadbutton.text('图片上传中，请稍后...');
      $("form").submit();
  })
});