var elasticsearch = require('elasticsearch');
var express = require('express');
var request = require('request');
var parseString = require('xml2js').parseString;
var uuid = require('uuid/v1');


var client = new elasticsearch.Client({
    host: 'search-datamonitor-tzysjfkgasry6mhfx6bkzf6tvi.us-west-1.es.amazonaws.com',
    log: 'info'
});

client.ping({
  requestTimeout: 5000
}, function (error) {
  if (error) {
	console.trace('elasticsearch cluster is down!');
} else{
	console.log('All is well');
}
});  

var uploadToElastic = function (items) {
    for (var i = 0; i < items.length; ++i) {
        client.create({
            index: 'data',
            type: 'waitTime',
            id: uuid(),
            body: items[i]
        }, function (error, response) {
		if(error) {
			console.log(error);
		}
		console.log("UPLOADED DATA")
        })
    }
};

function fetchWaitingtimes() {
    request('http://www.universalstudioshollywood.com/waittimes/?type=all&site=USH', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var upload = [];
            parseString(body, function (err, result) {
                var items = result.rss.channel[0].item;
                for (var i = 0; i < items.length; ++i) {
                    upload.push({
                       'timeStamp': Date.now(),
                       'rideName': items[i].title[0],
                       'waittime': items[i].description[0]
                    });
                }
            });
            uploadToElastic(upload);
        } else {
		console.log(error);
	}
    })
}


function searchTest(searchterm, callback) {
  client.search({
    index: 'data',  
    body: {
      "query": {
        "bool": {
          "must": {
            "match": {
              "keywords": searchterm
            }
          }
        }
      }
    }
  }, function (error, response) {
    console.log(response);
    if (callback) {
      callback(response);
    }
  });
}
			

var wait = 60000
var waitTimer = function () {
    setInterval(function () {
        fetchWaitingtimes();
    }, wait)
};

var app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/search', function (req, res) {  
  searchTest(req.query.q, function(result) {
    res.send(result);
  });
})

app.listen(3000, function () {
  console.log('Data app listening on port 3000!')
})
