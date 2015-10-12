'use strict'

var request = require('request');
var express = require('express');
var md5 = require('md5');
var base64 = require('js-base64').Base64;
var evts = require('events');
var ct = require('./lib/concat');
var queue = require('./lib/queue');

handle.prototype = {};

function handle(argument){
  console.log(argument);
  var req = argument.req;
  var res = argument.res;
  var options = argument.options || {};
  var cache = argument.cache;
  var url = req.url;
  var concat_name = "concat";
  var file_arr = getFiles(url,concat_name);
  var load_files = 0;
  var concat = {
    "reqUrl" : url,
    "root" : options.root,
    "name" : "concat",
    "path" : "",
    "file" : ""
  };
  concat.path = concat.root + "/" + concat.name;
  concat.file = concat.path + "/" + concat.reqUrl;

  var result = {
    "content" : "",
    "status" : 200,
    "type" : ""
  }

  var cache_options = {
    max: 50000000,
    maxAge: 1000 * 60 * 60,
    stale: true
  }

  var cache_key = base64.encode(concat.file);

  if(cache.has(cache_key)){
    console.log("cache");
    var cache_content = cache.get(cache_key);
    result.content = base64.decode(cache_content);
    setReponse(res,result);
    return;
  }else{
    console.log("没有cache");
  }

  ct(file_arr, concat, function(err, result){
    if(err){
      console.log(err);
      return;
    }
    if(result.toCache !== undefined && result.toCache === true){
      cache.set("a",result.content);
    }else{

      // util.inherits(Queue, evts);
      // var queue = new Queue();

      // http.createServer(function(req, res){
      //   queue.on('ready:mod~a.js,mod~b.js', function(response){
      //     response.pipe(res)
      //   })

      //   if(!queue.has('mod~a.js,mod~b.js')){
      //     queue.add('mod~a.js,mod~b.js');
      //     getResponse('mod~a.js,mod~b.js', function(err, response){
      //      queue.emit('ready:mod~a.js,mod~b.js', response); 
      //    })
      //   }
      // });
    }
    console.log(result);

    setReponse(res,result);
  })
}

function setReponse(res,result){
  //console.log(result);
  res.setHeader(
    "Content-Length", 
    result.content.length
  );
  res.setHeader(
    "Content-Type", 
    result.type
  );
  res.send(result.content);
}

function getFiles(url,concat_name){
  url = url.replace("/"+ concat_name +"/","");
  url = url.replace(/\~/g,"/");
  return url.split(",");
}

module.exports = handle
