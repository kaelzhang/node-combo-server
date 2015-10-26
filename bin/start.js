#!/usr/bin/env node
'use strict'
var ini = require('ini');
var home = require('home');
var lrucache = require('lru-cache');
var fs = require('fs');
var program = require('commander');
var express = require('express');
var server = require('../index');
var default_options = {
  "port" : "8888",
  "config" : "../static-combo-server/config.ini",
  "root" : "./test/fixture/dir"
};

program
.version('0.0.1')
.option('-c, --config [path]', 'Add config')
.option('-p, --port [post]', 'Add port')
.parse(process.argv);


program.config = program.config || default_options.config;


var config_path = home.resolve(default_options.config);
console.log(config_path)

try { 
  var config = ini.parse(fs.readFileSync(config_path, 'utf-8'))
} catch (err) {
  console.log("ini文件不存在");
  process.exit(1);
}

config.port = apply_default('port');
config.root = apply_default('root');
config.root = home.resolve(config.root);

// server(config, function(){
//   console.log('server started at ' + config.port)
// })

function apply_default (key) {
  return program[key] || config[key] || default_options[key];
}


var app = express();

//var memcache = new MemcacheAdapter(options);

// cache.get(key, callback)
// cache.set(key, value, callback)

var cache_options = {
  max: 50000000,
  maxAge: 1000 * 60 * 60,
  stale: true
}

var my_cache = lrucache(cache_options);

 app.use(function(req, res){
  server({
    req: req,
    res : res,
    options: config,
    cache: my_cache
  });
});

app.listen(config.port, function(){
  console.log("server start on " + config.port)
});