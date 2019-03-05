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

/*
return new Promise((resolve, reject) => {
		const configPath = path.join(process.cwd(), 'designr.json');
		files.readFileJson(configPath).then(config => {
			config.version = '0.0.2'; // !!!
			if (version) {
				if (isValidVersion(version, config.version)) {
					config.version = version;
				} else {
					return reject('invalid version');
				}
			} else {
				config.version = nextMinorVersion(config.version);
			}
			const libraryPath = path.join(process.cwd(), 'projects', config.library);
			const directories = files.getDirectories(libraryPath);
			if (!directories.length) {
				return reject('no projects to publish');
			}
			const names = [];
			const packages = directories.map(folder => {
				// console.log(path.basename(folder));
				const name = path.basename(folder);
				const file = path.join(folder, 'package.json');
				return files.readFile(file).then(content => {
					// names.push(content.match(/\"name\"\:\s.\"(.*)\"/)[1]);
					names.push(content.split('"name": "')[1].split('"')[0]);
					content = content.replace(/(\"version\":\s*\"[\d\.]*\")/g, `\"version\": \"${config.version}\"`);
					return files.writeFile(content, file);
				});
			});
			const components = directories.map(folder => {
				// console.log(path.basename(folder));
				const name = path.basename(folder);
				const file = path.join(folder, 'src', 'lib', `${name}-module.component.ts`);
				return files.readFile(file).then(content => {
					content = content.replace(/(\'[\d\.]*\')/g, `'${config.version}'`);
					return files.writeFile(content, file);
				});
			});
			Promise.all([
			files.writeFileJson(config, configPath),
				...packages,
				...components,
			]).then(results => {
				const builds = names.map(x => () => command.child(`ng build ${x}`));
				const distPath = path.join(process.cwd(), 'dist', config.library);
				const directories = files.getDirectories(distPath);
				const publish = directories.map(x => () => {
					return command.npmPublish(x);
				});
				return files.serial([
					...builds,
					// ...publish,
				]).then(results => {
					resolve(results);
				}, error => {
					reject(error);
				});
			}, error => {
				reject(error);
			});
		}, error => {
			reject('designr.json not found');
		});
	});
*/

function render(callback, baseUrl) {
	return new Promise((resolve, reject) => {
		try {
			const params = [];
			// console.log(params);
			// console.log(process.env);
			/*
			let slug = Object.keys(process.env)
				.find(x => x.indexOf('npm_config_slug') === 0);
			slug = slug ? slug.split('npm_config_slug_')[1] : '/';
			// console.log(slug);
			params[3] = slug;
			*/
			callback((error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			}, '/', {}, baseUrl, '/', {
				originalHtml: `<!doctype html>
			<html lang="en">

			<head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#">
				<meta charset="utf-8">
				<title>Website Title</title>
				<base href="/">
				<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes">
				<link rel="icon" type="image/x-icon" href="favicon.ico">
				<!-- <link rel="manifest" href="manifest.json"> -->
				<meta name="theme-color" content="#1976d2">
			</head>

			<body>
				<app-component></app-component>
				<noscript>This application requires JavaScript.</noscript>
			</body>

			</html>`
			});

		} catch (error) {
			reject(error);
		}
	});
};

module.exports = {
	run,
};
