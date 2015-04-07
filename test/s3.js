var fs = require('fs');
var FileStore = require('..');
var assert = require('assert');

if (!process.env.AMAZON_ACCESS_KEY_ID) return;

describe('S3 Backend', function() {
  
  before(function() {
    this.backend = FileStore('s3', {
      key: process.env.AMAZON_ACCESS_KEY_ID,
      secret: process.env.AMAZON_ACCESS_KEY_SECRET,
      region: process.env.S3_REGION,
      bucket: process.env.S3_BUCKET
    });
  });
  
  it('#put', function(done) {
    this.backend.put({
      filename: 'a/b/c.js',
      contentType: 'application/javascript',
      stream: fs.createReadStream(__dirname + '/fs.js')
    }, function(err) {
      assert(!err);
      done();
    });
  });
  
  it('#get', function(done) {
    this.backend.get('a/b/c.js', function(err, file) {
      assert(!err);
      assert.equal(file.filename, 'a/b/c.js');
      assert.equal(file.contentType, 'application/javascript');
      assert(!!file.stream);
      done();
    });
  });
  
  it('#get (missing)', function(done) {
    this.backend.get('a/b/d.js', function(err, file) {
      assert.equal(err.message, 'File not found');
      done();
    });
  });
  
  it('#remove', function(done) {
    this.backend.remove('a/b/c.js', function(err) {
      assert(!err);
      assert(!fs.existsSync(__dirname + '/test/a/b/c.js'));
      done();
    });
  });
});