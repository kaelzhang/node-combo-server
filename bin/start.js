#!/usr/bin/env node
'use strict'
var ini = require('ini');
var home = require('home');
var fs = require('fs');
var program = require('commander');


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

server(config, function(){
  console.log('server started at ' + config.port)
})

function apply_default (key) {
  return program[key] || config[key] || default_options[key];
}