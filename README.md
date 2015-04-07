# express-file-store

express middleware to access/write/remove files (using file path) with various backends.

[![NPM Package](https://img.shields.io/npm/v/express-file-store.svg?style=flat)](https://www.npmjs.org/package/express-file-store)
[![Build Status](https://travis-ci.org/seedalpha/express-file-store.svg?branch=master)](https://travis-ci.org/seedalpha/express-file-store/branches)
[![Dependencies](https://david-dm.org/seedalpha/express-file-store.svg)](https://david-dm.org/seedalpha/express-file-store)

### Usage (middleware)

    $ npm install express-file-store --save

```javascript

var express = require('express');
var FileStore = require('express-file-store');

// using file system
var fileStore = FileStore('fs', {
  path: __dirname + '/public/uploads'
});

// or using gridfs
var fileStore = FileStore('gridfs', {
  url: 'mongodb://localhost:27017/test'
});

// or using s3
var fileStore = FileStore('s3', {
  key: process.env.AMAZON_ACCESS_KEY_ID,
  secret: process.env.AMAZON_ACCESS_KEY_SECRET,
  bucket: 'test',
  region: 'ap-southeast-1'
});

// in express
var app = express();

// POST /a/b/c.png to upload
// GET /a/b/c.png to download
// DELETE /a/b/c.png to remove
app.use(filestore.routes);

// or directly

fileStore.get('/a/b/c.png', function(err, file) {
  console.log(err, file); // null, { filename: '/a/b/c.png', contentType: 'image/png', length: 512, stream: [Readable] }
});

fileStore.put({
  filename: '/a/b/c/d.pdf',
  contentType: 'application/pdf',
  stream: fs.createReadStream('/d.pdf')
}, function(err) {
  console.log(err); // undefined
});

fileStore.remove('../../../../../usr', function(err, file) {
  console.log(err.message); // 'File not found'
});

// ...
```

### Usage (standalone)

    $ npm install -g express-file-store
    $ efs gridfs -p 8080 -u mongodb://localhost:27017/test # start a server with gridfs backend
    $ efs fs -p 8080 -p $(pwd) # start a server with fs backend
    $ efs fs # will start file server on port 8080 in current pwd
    $ efs s3 -p 8080 -k $AMAZON_ACCESS_KEY_ID -s $AMAZON_ACCESS_KEY_SECRET -b $S3_BUCKET -r $S3_REGION # start a server with S3 backend
    $ curl -F file=@README.md http://localhost:8080/README.md
    $ curl --data-binary @package.json -H "Content-Type: application/json" http://localhost:8080/package.json

### Development

    $ git clone git@github.com:seedalpha/express-file-store.git
    $ cd express-file-store
    $ npm install
    $ npm test # make sure you have mongodb and s3 credentials in place

### Author

Vladimir Popov <rusintez@gmail.com>

### License

MIT
