var request = require('request');

exports.jiexi = function(req, res) {
    var url = req.query.url;
    var re = /^(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?\.m3u8$/;

    if(re.test(url)) {
        return res.status(200).send(url);
    }
    var urlarr = url.split('//');
    var schema = urlarr[0];
    var pureurl = urlarr[1];
    var host = schema+'//'+pureurl.split('/')[0];
    request(url, function(err, response, body) {
        if(err) {
            console.log(err);
        }
        if (response && response.statusCode == 200) {
            var re1 = /\/\d{8}\/\w{8}\/1\.jpg/;
            var re = /"\/.*\.m3u8/;
            var jiexiurl = '';
            if(body.match(re)) {
                var newurl = body.match(re)[0].replace('"',"");
                jiexiurl = newurl;
            } else {
                jiexiurl = body.match(re1)[0];
            }
            var m3u8url = jiexiurl.replace('1.jpg','index.m3u8');
            res.status(200).send(host+m3u8url);
        }
    })
}