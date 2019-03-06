const compareVersions = require('compare-versions');
const path = require('path');
const files = require('./files');
const command = require('./command');

const SOURCEMAP_EXPLORER_VERSION = '1.7.0';

function run(target) {
	return new Promise((resolve, reject) => {
		target = target || 'development';
		const segments = [...(target === 'docs' ? [target] : ['dist', target, 'browser'])];
		const errorMessage = `file not found ${path.join(...segments, 'main.{hash}.js')}`;
		const folder = path.join(process.cwd(), ...segments);
		files.find(folder, /^main\.(\w*)\.js$/).then(matches => {
			if (matches.length) {
				const url = path.join(process.cwd(), ...segments, matches[0]);
				console.log(url);
				command.sourceMapExplorerVersion().then(version => {
					if (compareVersions(version, SOURCEMAP_EXPLORER_VERSION) === -1) {
						return reject(`source-map-explorer -g required version >= ${SOURCEMAP_EXPLORER_VERSION}`);
					}
					return files.serial([
						() => command.sourceMapExplorer(url),
					]).then(results => {
						resolve(results);
					}, error => {
						reject(error);
					});
				}, error => {
					reject(error);
				});
			} else {
				reject(errorMessage);
			}
		}, error => {
			reject(errorMessage);
		});
	});
}

module.exports = {
	run,
};
