const files = require('./files');

function nextMinorVersion(version) {
	return version.split('.').map((x, i) => {
		return i === version.split('.').length - 1 ? parseInt(x) + 1 : x;
	}).join('.');
}

function publish(folder) {
	try {
		if (folder) {
			const _folder = path.resolve(__dirname, folder);
			if (isDirectory(_folder)) {
				const infoPath = path.join(_folder, 'info.json');
				files.readFileJson(infoPath)
					.then(info => {
						// info.version = nextMinorVersion(info.version);
						console.warn('\npublishing designr', info.version);
						const directories = files.getDirectories(_folder);
						const packages = directories.map(folder => {
							// console.log(path.basename(folder));
							const name = path.basename(folder);
							const file = path.join(folder, 'package.json');
							return readFile(file)
								.then(content => {
									content = content.replace(/(\"version\":\s*\"[\d\.]*\")/g, `\"version\": \"${info.version}\"`);
									return files.writeFile(content, file);
								});
						});
						const components = directories.map(folder => {
							// console.log(path.basename(folder));
							const name = path.basename(folder);
							const file = path.join(folder, 'src', 'lib', `${name}-module.component.ts`);
							return files.readFile(file)
								.then(content => {
									content = content.replace(/(\'[\d\.]*\')/g, `'${info.version}'`);
									return writeFile(content, file);
								});
						});
						Promise.all([
							files.writeFileJson(info, infoPath),
								...packages,
								...components,
							])
							.then(results => {
								return files.serial(directories.map(x => () => {
										return files.npmPublish(x);
									}))
									.then(results => {
										console.log('published!');
									});
							});
					});
			}
		}
	} catch (error) {
		console.warn('\npublish designr => [error]');
		console.log(error);
	}
}

module.exports = {
	publish,
};
