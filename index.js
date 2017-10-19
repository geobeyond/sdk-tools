var archiver = require('archiver');
var fs = require('fs-extra');
var path = require('path');
var replaceStream = require('replacestream');
var cp = require('child_process');

var exports = module.exports;

var line1 = new Buffer('Manifest-Version: 1.0\n');
var line2 = new Buffer('Created-By: 1.8.0_101 (Oracle Corporation)\n');
var line3 = new Buffer('\n');
var buf = Buffer.concat([line1,line2,line3]);
fs.writeFile('/tmp/MANIFEST.MF', buf, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The manifest file has been saved!");
});

exports.createPackage = function(outputFile) {
  var output = fs.createWriteStream(outputFile);
  var archive = archiver('zip');
  var rootdir = path.basename(outputFile, '.zip')
  output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    console.log('Package has been created at: ' + outputFile);
  });
  archive.on('error', function(err) {
    throw err;
  });

  var directories = [
    process.cwd() + '/node_modules/@boundlessgeo/sdk/dist/css',
    process.cwd() + '/data',
    process.cwd() + '/resources'
  ];
  var i, ii;
  for (i = directories.length - 1; i >= 0; --i) {
    try {
      fs.accessSync(directories[i], fs.F_OK);
    } catch(e) {
      directories.splice(i, 1);
    }
  }
  archive.pipe(output);

  archive
    .append(fs.createReadStream('/tmp/MANIFEST.MF'), { name: rootdir + '/META-INF/MANIFEST.MF' })
    .append(fs.createReadStream(process.cwd() + '/dist/app.min.js'), { name: rootdir + '/app.min.js' })
    .append(fs.createReadStream(process.cwd() + '/dist/index.html')
    .pipe(replaceStream('node_modules\/@boundlessgeo\/sdk\/dist\/css\/components.css', rootdir + '\/css\/components.min.css'))
    .pipe(replaceStream('<script src="\/loader.js"><\/script>', ''))
    .pipe(replaceStream('\/dist\/app-debug.js', 'app.min.js')), { name: rootdir + '/index.html' })
    .append(fs.createReadStream(process.cwd() + '/dist/css/app.min.css'), { name: rootdir + '/css/app.min.css' });
  for (i = 0, ii = directories.length; i < ii; ++i) {
    archive.directory(directories[i], directories[i].split('/').pop());
  }
  archive.finalize();
};

exports.createBuildDir = function() {
  var dir = 'dist';
  fs.ensureDir(dir, function (err) {
    if (err) {
      console.log(err);
    }
  });
};
