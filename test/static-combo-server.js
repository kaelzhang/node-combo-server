'use strict';

var expect = require('chai').expect;
var static_combo_server = require('../index');
var concat = require('../lib/concat')




var started;
function start_server (callback) {
  if (started) {
    return callback(null);
  };

  static_combo_server(options, callback)
}


// TDD
describe('abc', function(){
  it('should be true', function(done){
    start_server(function(err){
      expect(err).to.equal(null);

      request('localhost:8888/concat/.....').on('response', function(err, response){
        expect(reponse.body).to.equal(fs.readFileSync('./ccccxxx/concat.js').toString());
        done();
      })
    });
  });
});


