'use strict'

module.exports = concat;

var node_path = require('path');

var fs = require('graceful-fs');
var wrap = require('wrap-as-async');


// @param {Array.<path>} files files to concat
// @param {Object} options
function concat (files, options, callback) {
  if (arguments.length === 2) {
    callback = options;
    options = {};
  }

  var joiner = wrap(options.joiner || joiner);
  var counter = files.length;
  var contents = [];
  var already_done;

  function done (err, content, i) {
    if (already_done) {
      return;
    }

    if (err) {
      already_done = true;
      contents.length = 0;
      return callback(err);
    }

    contents[i] = content.toString();

    if (-- counter === 0) {
      joiner(contents, files, function (err, content) {
        if (err) {
          return callback(err);
        }

        callback(null, content);
      });
    }
  }

  files.forEach(function (file, i) {
    fs.readFile(file, function (err, content) {
      done(err, content, i);
    });
  });
}


function joiner (contents, files) {
  return contents.map(function (content, index) {
    var file = files[index];
    var basename = node_path.basename(file);

    return '// ' + basename + '\n' + content;

  }).join('\n\n');
}
