'use strict';

/*
	This is a node script for parsing an HTML doc file into a hierarchical directory structure.

	Install required NPM modules locally, but don't save to package.json file.
*/

var sourceFile = process.argv[2];
var destDir = process.argv[3];

if (!sourceFile || !destDir) {
	console.error('Usage:', process.argv[1], '<html file> <destination directory>');
	return process.exit(1);
}

var _ = require('lodash');
var cheerio = require('cheerio');
var fs = require('fs');
var mkdirp = require('mkdirp');

sourceFile = __dirname + '/../' + sourceFile;
destDir = __dirname + '/../' + destDir;

fs.statSync(sourceFile);
fs.statSync(destDir);

var $ = cheerio.load(fs.readFileSync(sourceFile));

var $els = $('*[id^="joint."]');
var regex = {
	nextNamespace: new RegExp('([a-zA-Z]+)[\\.:]')
};

$els.each(function() {

	var $el = $(this);
	var id = $el.attr('id');

	// Get rid of the `joint.` at the beginning of the ID.
	id = id.substr('joint.'.length);

	var namespaces = [];
	var match, nextNamespace;

	while (
		(match = id.match(regex.nextNamespace)) &&
		(nextNamespace = match[1])
	) {
		namespaces.push(nextNamespace);
		id = id.substr(nextNamespace.length + 1);
	}

	if (['.', ':'].indexOf(id[0]) !== -1) {
		id = id.substr(1);
	}

	if (namespaces) {

		var tagName = $el[0].tagName;
		var method = id;
		var html = '';

		switch (tagName) {

			case 'li':
				html = $el.html();
				break;

			default:
				var $nextEl;

				while (
					($nextEl = ($nextEl && $nextEl.next()) || (!$nextEl && $el.next())) &&
					$nextEl.length > 0 &&
					!$nextEl.attr('id')
				) {
					html += $('<div/>').append($nextEl.clone()).html();
				}
				break;
		}

		if (html) {

			var dir = destDir + '/' + namespaces.join('/');
			var file = dir + '/' + method + '.html';

			// console.log('----------------------');
			// console.log($el.attr('id'));
			// console.log(dir);
			// console.log(file);

			mkdirp.sync(dir);
			fs.writeFileSync(file, html);
		}
	}
});
