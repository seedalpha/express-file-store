/**
 * S3 backend
 * serve files from AWS S3
 */

/**
 * Module dependencies
 */

var aws       = require('aws-sdk');
var readable  = require('s3-readable');
var writeable = require('s3-writeable');

/**
 * Constructor
 *
 * @param {Object} config
 *   @param {String} key
 *   @param {String} secret
 *   @param {String} region
 *   @param {String} bucket
 */

function S3Backend(config) {
  if (!(this instanceof S3Backend))
    return new S3Backend(config);
  
  aws.config.update({
    accessKeyId:      config.key,
    secretAccessKey:  config.secret,
    region:           config.region
  });

  this.bucket = config.bucket;
  this.store = new aws.S3();
  this.readable = readable(this.store);
  this.writeable = writeable(this.store);
}

/**
 * Get file from S3
 *
 * @param {String} key
 * @param {Function} callback(error, result)
 */

S3Backend.prototype.get = function(key, cb) {
    
  var called = false;
  
  var stream = this.readable.createReadStream({
    Bucket: this.bucket,
    Key: key
  });
  
  stream.on('open', function(file) {
    cb(null, {
      length:       file.ContentLength,
      contentType:  file.ContentType,
      filename:     key,
      stream:       stream
    });
  });
  
  stream.on('error', function(err) {
    if (called) return;
    called = true;
    if (err.statusCode === 403) {
      cb(new Error('File not found'));
    } else {
      cb(err);
    }
  });
  
  stream.read(0);
}


/**
 * Put file to S3
 *
 * @param {Object} params
 *   @param {String} contentType
 *   @param {String} filename
 *   @param {Readable} stream
 * @param {Function} callback(error)
 */

S3Backend.prototype.put = function(params, cb) {
  
  var stream = this.writeable.createWriteStream({
    Bucket: this.bucket,
    Key: params.filename,
    ContentType: params.contentType
  });
    
  stream.on('error', cb);
  stream.on('end', cb);
  
  params.stream.pipe(stream);
}


/**
 * Remove file from S3
 *
 * @param {String} key
 * @param {Function} callback(error)
 */

S3Backend.prototype.remove = function(key, cb) {  
  this.store.deleteObject({
    Bucket: this.bucket,
    Key: key
  }, cb);
}


/**
 * Expose
 */

exports = module.exports = S3Backend;