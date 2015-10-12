'use strict'
var http = require('http');

Queue.prototype = {};

function Queue (argument) {
  var self = this;
  self.url = (argument.url !== undefined)?argument.url:"";
  self.hasCache = (argument.hasCache !== undefined)?argument.hasCache:false;
  self.listener = "ready:" + self.url; 

}
Queue.prototype.has = function(){
  return true
}