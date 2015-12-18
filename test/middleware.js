'use strict';

var expect = require('chai').expect;
var combo = require('../');
var node_path = require('path');

function root (path) {
  return node_path.join(__dirname, 'fixture', path)
}

var express = require('express')
var app = express()

var middleware = combo({
  routers: [
    {
      location: '/mod',
      root: root('static')
    }
  ],
  base: '/combo'
})

app.use(middleware)
app.listen(8888)
