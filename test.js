var fs = require('fs');
var archiver = require('archiver');
var output = fs.createWriteStream('./example.tar.gz');
var archive = archiver('tar', {
    gzip: true,
    zlib: { level: 9 } // Sets the compression level.
});

archive.on('error', function(err) {
  throw err;
});

// pipe archive data to the output file
archive.pipe(output);

// append files
archive.file('/tmp/crate-tito.json');
//archive.file('/path/to/README.md', {name: 'foobar.md'});

// Wait for streams to complete
archive.finalize();