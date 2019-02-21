const path = require('path');
const command = require('./command');
const files = require('./files');

function nextMinorVersion(version) {
	return version.split('.').map((x, i) => {
		return i === version.split('.').length - 1 ? parseInt(x) + 1 : x;
	}).join('.');
}

function isValidVersion(version, configVersion) {
	const next = version.split('.').map(x => parseInt(x));
	const current = configVersion.split('.').map(x => parseInt(x));
	return next.length === current.length && next !== current && next.reduce((flag, v, i) => flag && v >= current[i], true);
}

function getNextConfig(version) {
	return new Promise((resolve, reject) => {
		const configPath = path.join(process.cwd(), 'designr.json');
		files.readFileJson(configPath).then(config => {
			if (version) {
				if (isValidVersion(version, config.version)) {
					config.version = version;
				} else {
					return reject('invalid version');
				}
			} else {
				config.version = nextMinorVersion(config.version);
			}
			return resolve(config);
		}, error => {
			reject('designr.json not found');
		});
	});
}

function publish(version) {
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
}

module.exports = {
	getNextConfig,
	publish,
};
