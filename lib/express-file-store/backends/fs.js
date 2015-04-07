/**
 * File system backend
 * serve files from file system
 */

/**
 * Module dependencies
 */

var fs      = require('fs');
var mime    = require('mime');
var join    = require('path').join;
var dirname = require('path').dirname;
var mkdirp  = require('mkdirp');

/**
 * Constructor
 */

function FSBackend(config) {
  if (!(this instanceof FSBackend)) {
    return new FSBackend(config);
  }
  
  if (typeof config === 'string') {
    config = { path: config };
  }
  
  this.config = config;
}

/**
 * Get file from fs
 *
 * @param {String} path
 * @param {Function} cb(err, result)
 */

FSBackend.prototype.get = function(path, cb) {
  path = join(this.config.path, path);
  
  // ensure we are still in parent dir
  if (path.indexOf(this.config.path) !== 0) {
    return cb(new Error('File not found'));
  }
  
  // check length and some other stuff
  fs.stat(path, function(err, stats) {
    if (err) return cb(new Error('File not found'));
    if (!stats.isFile()) {
      return cb(new Error('File not found'));
    }
    
    cb(null, {
      length: stats.size,
      contentType: mime.lookup(path),
      filename: path.split(this.config.path)[1].slice(1),
      stream: fs.createReadStream(path)
    });
  }.bind(this));
}

/**
 * Put file to fs
 *
 * @param {Object} params
 *   @param {String} filename
 *   @param {Readable} stream
 * @param {Function} cb(err)
 */

FSBackend.prototype.put = function(params, cb) {
  var path = join(this.config.path, params.filename);
  
  // ensure we are still in parent dir
  if (path.indexOf(this.config.path) !== 0) {
    return cb(new Error('File not found'));
  }
  
  mkdirp(dirname(path), function(err) {
    if (err) return cb(err);
    
    var stream = fs.createWriteStream(path);
  
    stream.on('error', cb);
    stream.on('finish', cb);
  
    params.stream.pipe(stream);
    
  });
}

/**
 * Remove file from fs
 *
 * @param {String} path
 * @param {Function} cb(err)
 */

FSBackend.prototype.remove = function(path, cb) {
  path = join(this.config.path, path);
  
  // ensure we are still in parent dir
  if (path.indexOf(this.config.path) !== 0) {
    return cb(new Error('File not found'));
  }
  
  fs.unlink(path, cb);
}

/**
 * Expose
 */

exports = module.exports = FSBackend;