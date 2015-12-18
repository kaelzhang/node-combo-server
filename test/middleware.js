'use strict';

var expect = require('chai').expect;
var combo = require('../');

var express = require('express')
var app = express()

var middleware = combo({
  routers: [],
  base: '/combo'
})