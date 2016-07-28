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
  

});
var row = "<input type='text' name='resources' placeholder='请输入百度云,360云,电驴或者磁力链接!' class='form-resource form-control'>";
var addrow = $(".addrow");
  addrow.click( function(){
     $(".resources").append(row);
  });