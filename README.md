[![Build Status](https://travis-ci.org/kaelzhang/combo-server.svg?branch=master)](https://travis-ci.org/kaelzhang/combo-server)


# combo-server

Express and connect middleware to combo static assets.

## Install

```sh
$ npm install combo-server --save
```

## Usage

```js
var config = {
  routers: [
    {
      location: '/mod',
      root: '/data/static'
    }
  ],
  
  // Optional
  // If the pathname of the url doesn't start with '/combo/',
  // it will skip and go to the next middleware
  base: '/combo'
}

var app = require('express')()
var middleware = require('combo-server')(config)
app.use(middleware)
app.listen(8888)
```

By default, when visiting:

```sh
http://localhost:8888/combo/mod/a.js,mod/b.js
```

It will returns the comboed content of `'/data/static/a.js'` and `'/data/static/b.js'`.

- config `Object`
  - url_parser `function(url, config)`
  - joiner `function(contents)`
