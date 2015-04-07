var Router = require('express').Router;
var debug  = require('debug')('express-file-store');
var mime   = require('mime');
var Busboy = require('busboy');

var formData = [
  'multipart/form-data', 
  'application/x-www-form-urlencoded'
];

exports = module.exports = function FileStore(name, config) {
  
  var backend = require([__dirname, 'backends', name].join('/'))(config);
  
  function rawPost(req, res, next) {
    var contentType = req.headers['content-type'];
    
    if (formData.some(function(prefix) { return contentType.indexOf(prefix) > -1 })) {
      return next();
    }

    backend.put({
      filename: req.params[0],
      contentType: req.headers['content-type'],
      stream: req
    }, function(error) {
      if (error) return next(error);
      res.status(200).end();
    });
  }

  function formPost(req, res) {
    var busboy = new Busboy({
      headers: req.headers,
      limits: {
        files: 1
      }
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      backend.put({
        filename: req.params[0],
        contentType: mimetype,
        stream: file
      }, function(error) {
        if (error) return next(error);
        res.status(200).end();
      });
    });

    req.pipe(busboy);
  }
  
  var routes = Router();
  
  routes
    // catch all
    .route('/*')
  
    // skip empty paths
    .all(function(req, res, next) {
      if (req.params[0].length) return next();
      next('No path given');
    })
    
    .get(function(req, res, next) {
      backend.get(req.params[0], function(err, file) {
        if (err) return next(err);
        res.type(file.contentType);
        file.stream.pipe(res);
      });
    })
    
    .post(rawPost, formPost)
    
    .delete(function(req, res, next) {
      backend.remove(req.params[0], function(err) {
        if (err) return next(err);
        res.status(200).end();
      });
    });
  
  return {
    get: backend.get.bind(backend),
    put: backend.put.bind(backend),
    remove: backend.remove.bind(backend),
    routes: routes
  }
}