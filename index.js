'use strict'

module.exports = middleware

var concat = require('./lib/concat')
var AsyncCache = require('async-cache')
var router = require('neuron-router')
var async = require('async')
var fs = require('graceful-fs')
var unique = require('array-unique')
var mime = require('mime');


var node_url = require('url')


// @param {Object} options
// - parser: {function(url)} should returns {
//     paths: {Array.<path>}
//     version: {String=} optional
//   }
// - base: {String}
// - joiner: {function()} method to join file contents
// - routers: {Array.<router>}
function middleware (options) {
  var ac = new AsyncCache({
    max: 1000,
    maxAge: 1000 * 60 * 60 * 12,
    load: function (url, callback) {
      var parser = options.path_parser || middleware.parse_path
      var parsed = parser(url)

      async.map(parsed.paths, function (path, done) {
        middleware.get_content(path, options, done)

      }, function (err, contents) {
        if (err) {
          return callback(err)
        }

        callback(null, contents)
      });
    }
  })

  function handler (req, res, next) {
    var url = req.url

    ac.get(url, function (err, contents) {
      if (err) {
        return res.status(404).end('Failed to read "' + err.pathname + '"')
      }

      var joiner = options.joiner || middleware.join_contents;
      var content = joiner(contents);
      var last = contents[contents.length - 1].
      var content_type = mime.lookup(last.filename);

      res.status(200)
      res.set('Content-Type', content_type)
      res.set('Content-Length', content.length)
      res.send(content)
      res.end()
    })
  }

  return handler;
}


middleware.get_content = function (pathname, options, callback) {
  router.route(path, {
    routers: options.routers
  }, function (filename, fallback_url) {
    if (!filename) {
      return callback({
        code: 'ROUTE_NOT_FOUND',
        path: pathname
      })
    }

    fs.readFile(filename, function (err, content) {
      if (err) {
        return callback({
          code: 'ERR_READ_FILE',
          file: filename,
          path: pathname,
          err: err
        })
      }

      callback(null, {
        pathname: pathname,
        filename: filename,
        content: content.toString()
      })
    })
  })
}


// /combo/mod/a.js,mod/b.js
// -> {
//   paths: ['/mod/a.js', '/mod/b.js'],
//   version: ''
// }
middleware.parse_path = function (url, options) {
  var parsed = node_url.parse(url, true)
  var version = parsed.query.v || ''
  var pathname = parsed.pathname

  var index = pathname.indexOf(options.base)
  if (~index) {
    pathname = pathname.slice(index + options.base.length)
  }

  var paths = pathname
    .split(',')
    .map(function (path) {
      return middleware.make_sure_leading_slash(path)
    })

  return {
    paths: unique(paths),
    version: version
  }
}


middleware.join_contents = function (contents) {
  return contents.map(function (content) {
    var pathname = content.pathname;
    return '// ' + pathname + '\n' + content.content;

  }).join('\n\n');
}


middleware.make_sure_leading_slash = function (path) {
  return path.replace(/^\/*/, '/')
}
