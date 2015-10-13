'use strict'
module.exports = Queue;

Queue.prototype = {};

function Queue (argument) {
  var self = this;
  self.list = {};
}
Queue.prototype.has = function(key){
  var self = this;
  return (self.list[key] === undefined)?false:true;
}
Queue.prototype.add = function(key){
  var self = this;
  self.list[key] = true;
}