const compareVersions = require('compare-versions');
const path = require('path');
const files = require('./files');
const command = require('./command');

const BUNDLE_ANALYZER_VERSION = '3.1.0';

function run(target) {
	return new Promise((resolve, reject) => {
		target = target || 'development';
		const segments = [...(target === 'docs' ? [target] : ['dist', target, 'browser'])];
		const errorMessage = `file not found ${path.join(...segments, 'stats.json')}`;
		const src = path.join(process.cwd(), ...segments, 'stats.json');
		files.exists(src).then(success => {
			console.log(src);
			command.bundleAnalyzerVersion().then(version => {
				if (compareVersions(version, BUNDLE_ANALYZER_VERSION) === -1) {
					// ??? locally?
					return reject(`webpack-bundle-analyzer -g required version >= ${BUNDLE_ANALYZER_VERSION}`);
				}
				return files.serial([
					() => command.bundleAnalyzer(src),
				]).then(results => {
					resolve(results);
				}, error => {
					reject(error);
				});
			}, error => {
				reject(error);
			});
		}, error => {
			reject(errorMessage);
		});
	});
}

module.exports = {
	run,
};
