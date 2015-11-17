/*global module process require Buffer __dirname*/
'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');
var cp = require('child_process');
var _ = require('lodash');
var fs = require('fs-extra-promise');
var isWin = /^win/.test(process.platform);
var binPath = path.join(
		__dirname,
		'smartsprites-0.2.11/smartsprites.' + (isWin ? 'cmd' : 'sh')
);

var availableOptions = [
	// 'root-dir-path',
	// 'css-files',
	// 'output-dir-path',
	'document-root-dir-path',
	// 'log-level',
	'sprite-png-depth',
	'sprite-png-ie6',
	'css-file-encoding'
	// 'css-file-suffix'
];

module.exports = function(options) {
	try {
		if (!options || !options.documentRootDirPath) {
			throw new gutil.PluginError('gulp-smartsprites', '`documentRootDirPath` options required');
		}
		var tmpPath = options.tmpPath || '/tmp/';
		tmpPath = path.resolve(tmpPath) + '/';
		var data = _.extend({
			stdout: true,
			stderr: true,
			smartspritePath: binPath,
			callback: function() {}
		}, options);

		// Provide arguments
		var args = [];
		availableOptions.forEach(function(opt) {
			var camelized = _.camelCase(opt);

			if (data[camelized]) {
				args.push('--' + opt + ' ' + data[camelized]);
			}
		});

		args = args.join(' ');
	} catch (err) {
		throw new gutil.PluginError('gulp-smartsprites', err);
	}
	return through.obj(function(file, enc, cb) {
		if (file.isNull() || path.extname(file.path) !== '.css') {
			console.log(file.path);
			return cb(null, file);
		}

		if (file.isStream()) {
			return cb(new gutil.PluginError('gulp-smartsprites', 'Streaming not supported'));
		}
		var temp = tmpPath + 'smart-sprite-' + Math.random() + '/';
		var spritesPath = options.spritesPath || path.dirname(file.path);
		spritesPath += '/';
		try {
			fs.mkdirsSync(temp);
			file.contents = new Buffer(file.contents.toString().replace(/(?:\s+)(\/\*\* sprite-ref: .*?; \*\/)/mg,
				function(match, directive) {
					return directive;
				}));
			fs.writeFile(temp + 'input.css', file.contents.toString(), processSmartSprites.bind(this));
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-smartsprites', err));
		}

		function processSmartSprites() {
			var cmd = data.smartspritePath + ' ' + temp + 'input.css' + ' ' + args;
			gutil.log('log', 'Execute ', cmd);
			var child = cp.exec(cmd);

			// Pipe std if needed
			if (data.stdout) {
				child.stdout.on('data', gutil.log.bind(gutil));
			}
			if (data.stderr) {
				child.stderr.on('data', gutil.log.bind(gutil));
			}

			child.on('exit', function(code) {
				if (code !== 0) {

					this.emit('error', new gutil.PluginError('gulp-smartsprites', 'Exited with code: ' + code + '! (' + temp + ')'));
					return cb(null, file);
				}
				gutil.log('Exited with code: ' + code + '.');
				readFiles(this, temp);
			}.bind(this));
		}
		function readFiles(context, temp) {
			var files = fs.readdirSync(temp).filter(function(file) {
				return path.extname(file) === '.png';
			});
			var promises = files.map(function(file) {
				return fs.readFileAsync(temp + file);
			});
			promises.push(fs.readFileAsync(temp + 'input-sprite.css'));
			Promise.all(promises).then(doneProcessing.bind(context, files));
		}
		function doneProcessing(files, fileContents) {
			files.map(function(fileName, i) {
				console.log({
					base: fileName,
					cwd: file.cwd
				});
				var fileObject = file.clone();
				fileObject.path = spritesPath + fileName;
				fileObject.contents = new Buffer(fileContents[i]);
				console.log(fileObject.path, file.path);
				this.push(fileObject);
			}.bind(this));
			file.contents = new Buffer(fileContents[fileContents.length - 1].toString());
			this.push(file);
			fs.remove(temp);
			// cb(null, file);
		}
	});
};
