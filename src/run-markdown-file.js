'use strict';
const fs = require('./fs-promise'),
	sequentialPromiseMap = require('./sequential-promise-map'),
	fsUtil = require('./fs-util'),
	fsPromise = require('./fs-promise'),
	path = require('path'),
	mdToHtml = require('./md-to-html'),
	runExamples = require('./run-examples'),
	mergeResults = require('./merge-results'),
	saveResultFiles = require('./save-result-files'),
	extractExamplesFromHtml = require('./extract-examples-from-html'),
	log = require('./debug-log'),
	isMarkdown = function (filePath) {
		return path.extname(filePath) === '.md';
	},
	stripExtension = function (filePath) {
		return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
	},
	resultDir = 'results',
	exampleDir = 'examples',
	fixtureDir = 'examples',
	runMdFile = function (workingDir, filePath) {
		let htmlDoc;
		const mdPath = path.join(workingDir, filePath),
			resultsPath = stripExtension(mdPath);
		fsUtil.ensureCleanDir(resultsPath);
		return fs.readFileAsync(mdPath, 'utf8')
			.then(log)
			.then(mdToHtml)
			.then(c =>  htmlDoc = c)
			.then(log)
			.then(extractExamplesFromHtml)
			.then(log)
			.then(examples => runExamples(examples, resultsPath, fixtureDir))
			.then(log)
			.then(examples => saveResultFiles(examples, resultsPath))
			.then(examples => mergeResults(htmlDoc, examples, path.basename(resultsPath)))
			.then(log)
			.then(htmlPageResult => fsPromise.writeFileAsync(resultsPath + '.html', htmlPageResult, 'utf8'))
			.then(() => fsUtil.remove(mdPath));
	};


fsUtil.ensureCleanDir(resultDir);
fsUtil.copy(path.join(exampleDir, '*'), resultDir);
sequentialPromiseMap(
	fsUtil.recursiveList(exampleDir).filter(isMarkdown),
	filePath => runMdFile (resultDir, filePath)
);
/*

*/
