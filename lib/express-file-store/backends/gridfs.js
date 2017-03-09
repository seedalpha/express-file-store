/**
 * GridFS backend
 * serve files from mongodb's gridfs
 */

/**
 * Module dependencies
 */

var MongoClient = require('mongodb').MongoClient;
var GridStore   = require('mongodb').GridStore;
var mime        = require('mime');

/**
 * Constructor
 */

function GFSBackend(config) {
  if (!(this instanceof GFSBackend)) {
    return new GFSBackend(config);
  }

  if (typeof config === 'string') {
    config = { url: config };
  }

  this.config = config;
  this.queue = [];

  MongoClient.connect(config.url, function(err, db) {
    if (err) throw err;
    this.db = db;
    var queue = this.queue;

    var run = function() {
      var task = queue.shift();
      if (task) {
        task.fn(db, function() {
          task.cb.apply(task.cb, arguments);
          run();
        });
      }
    };

    run();

  }.bind(this));
}

/**
 * Get file from GridFS
 *
 * @param {String} key
 * @param {Function} callback(error, file)
 */

GFSBackend.prototype.get = function(key, cb) {
  this._run(function(db, done) {
    GridStore(db, key, 'r').open(function(err, file) {
      if (err) return done(new Error('File not found'));
      var stream = file.stream(true);
      stream.on('end', function() {
        file.close();
      });
      done(null, {
        length: file.length,
        contentType: file.contentType || mime.lookup(key),
        filename: key,
        stream: stream
      });
    });
  }, cb);
}

/**
 * Put file to GridFS
 *
 * @param {Object} params
 *   @param {String} contentType
 *   @param {String} filename
 *   @param {Readable} stream
 * @param {Function} callback(error)
 */

GFSBackend.prototype.put = function(params, cb) {
  this._run(function(db, done) {
    GridStore(db, params.filename, 'w', { content_type: params.contentType || mime.lookup(params.filename) })
      .open(function(err, gs) {
        var stream = gs.stream();
        stream.on('end', function(err) {
          if (err) return done(err);
          gs.close(done);
        });
        params.stream.pipe(stream);
      });
  }, cb);
}

/**
 * Remove file from GridFS
 *
 * @param {String} key
 * @param {Function} callback(error)
 */

GFSBackend.prototype.remove = function(key, cb) {
  this._run(function(db, done) {
    GridStore.unlink(db, key, done);
  }, cb);
}

/**
 * Execute immediately or queue up
 *
 * @api private
 * @param {Function} fn(db, done)
 * @param {Function} cb(error, result)
 */

GFSBackend.prototype._run = function(fn, cb) {
  if (this.db && !this.queue.length) return fn(this.db, cb);
  this.queue.push({ fn: fn, cb: cb });
}

/**
 * Expose
 */

exports = module.exports = GFSBackend;
