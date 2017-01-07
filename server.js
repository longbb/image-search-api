"use strict";
var express = require("express");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var app = express();
var GoogleSearch = require("google-search");
var googleSearch = new GoogleSearch({
  key: process.env.API_KEY,
  cx: process.env.CX_KEY
});
 

var historySchema = new Schema({
  term: String,
  when: String
});
app.use(express.static(__dirname + "/views"));

var History = mongoose.model("History", historySchema);
var mongouri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/img-sal";
mongoose.connect(mongouri);

app.get("/api/latest/imagesearch", getHistory);

app.get("/api/imagesearch/:query", handlePost);

function handlePost(req, res) {
  var query = req.params.query;
  var size = req.query.offset || 10;
  var history = {
    "term": query,
    "when": new Date().toLocaleString()
  };
  if (query !== "favicon.icon") {
    save(history);
  }
  googleSearch.build({
    q: query,
    start: 1,
    num: size,
    searchType: "image"
  }, function(error, response) {
    if (error) throw error;
    res.send(response.items.map(makeList));
  });
}

function makeList(img) {
  return {
    "url": img.link,
    "snippet": img.snippet,
    "thumbnail": img.image.thumbnailLink,
    "context": img.image.contextLink
  };
}

function save(obj) {
  var history = new History(obj);
  history.save(function(err, history) {
    if (err) throw err;
  });
}

function getHistory(req, res) {
  History.find({}, null, {
    "limit": 10,
    "sort": {
      "when": -1
    }
  }, function(err, history) {
    if (err) return console.error(err);
    res.send(history.map(function(arg) {
      return {
        term: arg.term,
        when: arg.when
      };
    }));
  });
}

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log('Node.js listening on port ' + port);
});