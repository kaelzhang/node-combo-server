'use strict'
var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');
module.exports = concat;
concat.prototype = {};

function concat (file_arr,contact_path,callback) {
  var normal_err = "服务器错误";
  var result = {
    "status" : 200,
    "content" : "",
    "toCache" : false,
    "type" : ""
  };
  result.type = getType(contact_path.reqUrl);
  if(!result.type){
    return;
  }
  try {
    var content = fs.readFileSync(contact_path.file);//
    result.content = content;
    result.toCache = true;
    console.log("已经存在了")
    callback(false,result);
    return;
  } catch (err) {
    console.error(err.stack)
    return;
  }
  async.each(unique(file_arr), 
    function(file,callback) {
      var path = contact_path.root + "/" + file;
      fs.exists(path, function (exists) {
        if(!exists){
          result.status = 404;
          result.content = path + "不存在";
          callback(true,result);
          return;
        }else{
          fs.readFile(path, function (err, data) {
            if (err){
              result.content = normal_err;
              result.status = 500;
              callback(err,result);
              return;
            }
            result.content += (data + '\n\n');
            callback(false,result);
          });
        }
      });
    }, function(err){
      if(!err) {
        fse.createFile(contact_path.file,
          function(err){
            if(err){
              result.status = 500;
              result.content = normal_err;
              callback(false,result);
              return;
            }
            fs.writeFile(contact_path.file, result.content, function (err) {
              if (err){
                result.status = 500;
                result.content = normal_err;
                callback(false,result);
                return;
              }
              result.toCache = true;
              callback(false,result);
            });
          }
          );
      }else{
        callback(false,result);
      }
    }
  );
}
function getType (url){
  var content_type = {
    ".js" : "application/x-javascript",
    ".css" : "text/css"
  }
  var type = false;
  for(var m in content_type){
    if(url.indexOf(m)!= -1){
      type = content_type[m];
      break;
    }
  }
  return type;
}
