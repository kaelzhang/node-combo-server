'use strict'

var express = require('express');
var md5 = require('md5');
var http = require('http');
var ct = require('./lib/concat');
var queue = require('./lib/queue');

handle.prototype = {};

var que = new queue();

function handle(argument){
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

  var cache_key = md5(concat.file);

  if(cache.has(cache_key)){
    var cache_content = cache.get(cache_key);
    result.content = cache_content
    setReponse(res,result);
    return;
  }else{
    var que_key = getFiles(url,concat_name);
    var ready_que_key = 'ready:' + que_key;
    que.on(ready_que_key, function(result){
      //que.delete(ready_que_key);
      setReponse(res,result);
    })
    console.log(que.list);
    if(!que.has(que_key)){
      que.add(que_key);
    }else{
      return;
    }
    console.log("没有cache");
  }

  ct(file_arr, concat, function(err, result){
    if(err){
      console.log(err);
      return;
    }
    if(result.toCache !== undefined && result.toCache === true){
      console.log("******************")
      cache.set(cache_key, result.content);
      que.emit(ready_que_key,result); 
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
function getQueueName(url,concat_name){
  return url.replace("/"+ concat_name +"/","");
}
function getFiles(url,concat_name){
  url = url.replace("/"+ concat_name +"/","");
  url = url.replace(/\~/g,"/");
  return url.split(",");
}

module.exports = handle
