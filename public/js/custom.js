$(document).ready(function(){
  var summary = $(".summary").html();
  var maxwidth = 100;
  if( summary && summary.length > maxwidth) {
     $(".summary").html($(".summary").text().substring(0,maxwidth)
     	+ "...<a class='more' href='javascript:;'>展开全部</a>");
  }
  $("a.more").on('click', function(){
    $(".summary").hide();
    $(".summary-hidden").show();
  });
  var row = "<div class='form-resource input-group'><input type='text' name='resources' placeholder='请输入百度云,360云,电驴或者磁力链接!' class='form-control'><span class='input-group-btn'><button type='button' class='btn btn-default removerow'>删除此行</button></div>";
  var addrow = $(".addrow");
    addrow.click( function(){
       $(".resources").append(row);
    });
    $(".resources").on('click', '.removerow', function() {
        $(this).parent().parent().remove();
    });

});
