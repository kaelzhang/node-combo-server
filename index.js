'use strict'

var request = require('request');
var lrucache = require('lru-cache');
var http = require('http');
var fs = require('fs');
var fse = require('fs-extra');
var unique = require('array-unique');
var contact = require('./lib/concat');
var express = require('express');
var async = require('async');
var md5 = require('md5');
var base64 = require('js-base64').Base64;
module.exports = Start


function Start (options, callback) {
  var app = express();

  app.use(function(req, res){
    var url = req.url;
    var concat_name = "concat"; 
    var file_arr = getFiles(url,concat_name);
    var load_files = 0;
    var concat_path = options.root + "/" + concat_name;
    var concat_file = concat_path + "/" + url;
    var result = {
      "content" : "",
      "status" : 200,
      "type" : ""
    }
    result.type = getType(url);

    var cache_options = {
      max: 50000,
      maxAge: 1000 * 60 * 60 
    }
    var cache = lrucache(cache_options);
    var otherCache = lrucache(50);

    var cache_key = base64.encode(concat_file);
    console.log(cache.keys())
    cache.set("ssssw","ssssss");
    if(cache.has(cache_key)){
      console.log("cache");
      var cache_content = cache.get(cache_key);
      result.content = base64.decode(cache_content);
      setReponse(res,result);
      return;
    }else{
      console.log("没有cache");
    }

    try {
      var concat_content = fs.readFileSync(concat_file)
      result.content = concat_content;
      console.log(base64.encode(result.content));
      console.log("***********");
      cache.set(cache_key,base64.encode(result.content));
      cache.set("ssssw","ssssss");
      setReponse(res,result);
      console.log("已经存在了")
      return;
    } catch (err) {
      console.error(err.stack)
      return;
    }

    var check_length = file_arr.length;

    async.each(unique(file_arr), 
      function(file,callback) {
        var path = options.root + "/" + file;
        fs.exists(path, function (exists) {
          if(!exists){
            result.content = path + "不存在";
            result.status = 404;
            callback(1);
            return;
          }else{
            fs.readFile(path, function (err, data) {
              if (err){
                result.content = "服务器错误";
                result.status = 500;
                callback(err);
                return;
              }
              result.content += (data + '\n\n');
              callback();
            });
          }
        });
      }, function(err){
        if(!err) {
          //all ready
          //console.log(concat_file);
          fse.createFile(concat_file,
            function(err){
              if(err){
                result.content = "服务器错误";
                result.status = 500;
                setReponse(res,result);
                return;
              }
              fs.writeFile(concat_file, result.content, function (err) {
                if (err){
                  result.content = "服务器错误";
                  result.status = 500;
                }
                cache.set(cache_key,base64.encode(result.content));
                setReponse(res,result);
              });
            }
          );
        }else{
          setReponse(res,result);
        }
      }
    );
  //   /concat/mod~a.js,mod~b.js
  //   mod~a.js,mod~b.js
  //   ['mod/a.js', 'mod/b.js']
  //   fs.readFile
  //   res.header()
  //   res.send(content)

  //   concat([], function(err, result){
  //     result.headers
  //     result.content
  //     res.header(result.headers);
  //     res.send(result.content);
  //   })
  });
  app.listen(options.port, callback);
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

function getType(url){
  var content_type = {
    ".js" : "application/x-javascript",
    ".css" : "text/css"
  }
  var type = "text/html";
  for(var m in content_type){
    if(url.indexOf(m)!== -1){
      type = content_type[m];
      break;
    }
  }
  return type;
}