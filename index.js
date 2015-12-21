'use strict'

module.exports = combo

var AsyncCache = require('async-cache')
var router = require('neuron-router')
var async = require('async')
var fs = require('graceful-fs')
var unique = require('array-unique')
var mime = require('mime')
var request = require('request')
var set = require('set-options')

var node_url = require('url')

var DEFAULTS = {
  last_modified_ahead: 60 * 1000,
  cache_options: {
    max: 1000,
    maxAge: 1000 * 60 * 60 * 12
  }
}


// @param {Object} options
// - parser: {function(url)} should returns `paths` {Array.<path>}
// - base: {String}
// - joiner: {function()} method to join file contents
// - routers: {Array.<router>}
// - last_modified_ahead: {Number} see [rfc7323](https://tools.ietf.org/html/rfc7232#page-7)
// - search: {function()}
function combo (options) {
  options = set(options, DEFAULTS)
  var ac_options = set(options.cache_options, DEFAULTS.cache_options)

  ac_options.load = function (url, callback) {
    var parser = options.path_parser || combo.parse_path
    var paths = parser(url, options)

    async.map(paths, function (path, done) {
      combo.get_content(path, options, done)

    }, function (err, contents) {
      if (err) {
        return callback(err)
      }

      callback(null, {
        contents: contents,
        timestamp: combo._second_time(options.last_modified_ahead)
      })
    })
  }

  var ac = new AsyncCache(ac_options)

  function middleware (req, res, next) {
    var url = req.url

    if (options.base && !~url.indexOf(options.base)) {
      return next()
    }

    var cached = ac.has(url)
    ac.get(url, function (err, data) {
      if (err) {
        return res
          .status(404)
          .end('Failed to read "' 
            + combo.remove_leading_slash(err.pathname) + '"')
      }

      // RFC7232
      // > A recipient MUST ignore If-Modified-Since if the request contains an
      // > If-None-Match header field; the condition in If-None-Match is
      // > considered to be a more accurate replacement for the condition in
      // > If-Modified-Since, and the two are only combined for the sake of
      // > interoperating with older intermediaries that might not implement
      // > If-None-Match.
      if (req.get('If-None-Match')) {
        return normal_response()
      }

      var modified_since = + new Date(req.get('If-Modified-Since'))
      // > A recipient MUST ignore the If-Modified-Since header field if the
      // > received field-value is not a valid HTTP-date, or if the request
      // > method is neither GET nor HEAD.

      // NaN
      if (!modified_since) {
        return normal_response()
      }

      // 304
      if (cached
        && data.timestamp <= modified_since) {
        res.status(304)
        res.end()
        return
      }

      function normal_response () {
        var contents = data.contents
        var joiner = options.joiner || combo.join_contents
        var content = joiner(contents, options)
        var last = contents[contents.length - 1]
        var content_type = mime.lookup(last.pathname)

        res.status(200)
        res.set('Content-Type', content_type)
        res.set('Content-Length', content.length)
        res.set('Last-Modified', new Date(data.timestamp).toString())
        res.send(content)
        res.end()
      }
    })
  }

  return middleware
}


combo.get_content = function (pathname, options, callback) {
  router.route(pathname, options, function (filename, fallback_url) {
    if (filename) {
      return combo._get_file_content(filename, cb)
    }

    if (fallback_url) {
      return combo._get_remote_content(fallback_url, cb)
    }

    cb('ROUTE_NOT_FOUND')
  })

  function cb (err, data) {
    if (err) {
      var code = err;
      var e = data;
      var ret = {
        code: code,
        pathname: pathname
      }

      if (e) {
        ret.err = e
      }
      return callback(ret)
    }

    callback(null, {
      pathname: pathname,
      content: data
    })
  }
}


// Get the second time 
combo._second_time = function (ahead) {
  ahead = parseInt(ahead) || 0
  var time = + new Date - ahead

  return parseInt(time / 1000) * 1000
}


combo._get_file_content = function (filename, callback) {
  fs.readFile(filename, function (err, content) {
    if (err) {
      return callback('ERR_READ_FILE', err)
    }

    callback(null, content.toString())
  })
}


combo._get_remote_content = function (url, callback) {
  request(url, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return callback('FAILS_READ_REMOTE')
    }

    callback(null, body)
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

  var base = options.base
  var index
  if (base) {
    index = pathname.indexOf(options.base)
    if (~index) {
      pathname = pathname.slice(index + options.base.length)
    }
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
    var pathname = content.pathname
    return '// ' + combo.remove_leading_slash(pathname) + '\n' 
      + content.content

  }).join('\n\n')
}


combo.make_sure_leading_slash = function (path) {
  return path.replace(/^\/*/, '/')
}


combo.remove_leading_slash = function (path) {
  return path.replace(/^\/+/, '')
}
