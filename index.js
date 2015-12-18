'use strict'

module.exports = combo

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
function combo (options) {
  var ac = new AsyncCache({
    max: 1000,
    maxAge: 1000 * 60 * 60 * 12,
    load: function (url, callback) {
      var parser = options.path_parser || combo.parse_path
      var paths = parser(url, options)

      async.map(paths, function (path, done) {
        combo.get_content(path, options, done)

      }, function (err, contents) {
        if (err) {
          return callback(err)
        }

        callback(null, contents)
      });
    }
  })

  function middleware (req, res, next) {
    var url = req.url

    if (!~url.indexOf(options.base)) {
      return next()
    }

    ac.get(url, function (err, contents) {
      if (err) {
        return res.status(404).end('Failed to read "' + err.pathname + '"')
      }

      var joiner = options.joiner || combo.join_contents
      var content = joiner(contents, options);
      var last = contents[contents.length - 1]
      var content_type = mime.lookup(last.filename)

      res.status(200)
      res.set('Content-Type', content_type)
      res.set('Content-Length', content.length)
      res.send(content)
      res.end()
    })
  }

  return middleware
}


combo.get_content = function (pathname, options, callback) {
  router.route(pathname, {
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
combo.parse_path = function (url, options) {
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
      return combo.make_sure_leading_slash(path)
    })

  return unique(paths)
}


combo.join_contents = function (contents) {
  return contents.map(function (content) {
    var pathname = content.pathname;
    return '// ' + pathname + '\n' + content.content;

  }).join('\n\n');
}


combo.make_sure_leading_slash = function (path) {
  return path.replace(/^\/*/, '/')
}
