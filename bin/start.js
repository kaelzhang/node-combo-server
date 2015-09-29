#!/usr/bin/env node

var program = require('commander')({

})


// program -> options


var server = require('../index');


ini(program.config, function(err, config){



  server(program, function(){
    console.log('server started at ' + port)
  })

})

