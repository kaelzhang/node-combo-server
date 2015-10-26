'use strict'
var EventEmitter = require("events");
var util = require('util');
function Queue () {
  var self = this;
  self.list = {};
  EventEmitter.call(self);
}
util.inherits(Queue, EventEmitter);
Queue.Queue = Queue;
Queue.prototype.has = function(key){
  var self = this;
  return (self.list[key] === undefined)?false:true;
}
Queue.prototype.add = function(key){
  var self = this;
  self.list[key] = true;
}
Queue.prototype.delete = function(key){
  var self = this;
  delete self.list[key];
}
module.exports = Queue;