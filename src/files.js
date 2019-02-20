const fs = require('fs');
const path = require('path');

function isDirectory(path) {
	return fs.lstatSync(path).isDirectory();
}

function getDirectories(path) {
	return fs.readdirSync(path).map(name => path.join(path, name)).filter(isDirectory);
}

function isDirectoryEmpty(path) {
	return new Promise((resolve, reject) => {
		fs.readdir(path, (error, files) => {
			if (error) {
				reject(error);
			} else if (files.length === 0) {
				resolve();
			} else {
				reject(files);
			}
		});
	});
}

function readFiles(path) {
	return new Promise((resolve, reject) => {
		fs.readdir(path, (error, files) => {
			if (error) {
				reject(error);
			} else {
				resolve(files);
			}
		});
	});
}

function copyFolder(src, dest) {
	return new Promise((resolve, reject) => {
		readFiles(src)
			.then(
				(files) => {
					Promise.all(
							files.map(x => copyFile(
								path.join(src, x),
								path.join(dest, x)
							))
						)
						.then(
							files => {
								resolve(files);
							},
							error => {
								reject(error);
							});
				},
				error => {
					reject(error);
				}
			);
	});
}

function copyFile(src, dest) {
	return new Promise((resolve, reject) => {
		const folder = path.dirname(dest);
		existsOrCreateFolder(folder)
			.then(
				folder => {
					fs.copyFile(
						src,
						dest,
						(error) => {
							if (error) {
								reject(error);
							} else {
								resolve(dest);
							}
						}
					);
				},
				error => {
					reject(error);
				}
			);
	});
}

function readFile(src) {
	return new Promise((resolve, reject) => {
		fs.readFile(src, 'utf8', (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
}

function readFileJson(src) {
	return new Promise((resolve, reject) => {
		fs.readFile(src, 'utf8', (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(JSON.parse(data));
			}
		});
	});
}

function writeFile(content, dest) {
	return new Promise((resolve, reject) => {
		const folder = path.dirname(dest);
		existsOrCreateFolder(folder)
			.then(
				folder => {
					fs.writeFile(
						dest,
						content,
						'utf8',
						error => {
							if (error) {
								reject(error);
							} else {
								resolve(dest);
							}
						});
				},
				error => {
					reject(error);
				}
			);
	});
}

function writeFileJson(data, dest) {
	return new Promise((resolve, reject) => {
		const folder = path.dirname(dest);
		existsOrCreateFolder(folder)
			.then(
				folder => {
					fs.writeFile(
						dest,
						JSON.stringify(data, null, 2),
						'utf8',
						error => {
							if (error) {
								reject(error);
							} else {
								resolve(dest);
							}
						});
				},
				error => {
					reject(error);
				}
			);
	});
}

function existsOrCreateFolder(folder) {
	return new Promise((resolve, reject) => {
		fs.exists(folder, (exists) => {
			if (exists) {
				resolve(folder);
			} else {
				return fs.mkdir(folder, (error) => {
					if (error) {
						if (fs.existsSync(folder)) {
							resolve(folder);
						} else {
							reject(error);
						}
					} else {
						resolve(folder);
					}
				});
			}
		});
	});
}

function serial(tasks) {
	return tasks.reduce((promise, task) => {
		return promise.then(results => task().then(result => [...results, result]));
	}, Promise.resolve([]));
}

function getCurrentDirectoryBase() {
	return path.basename(process.cwd());
}

function directoryExists(filePath) {
	try {
		return fs.statSync(filePath).isDirectory();
	} catch (err) {
		return false;
	}
}

function changeCwd(path) {
	try {
		process.chdir(path);
		console.log('New directory: ' + process.cwd());
	} catch (err) {
		console.log('chdir: ' + err);
	}
}

module.exports = {
	getCurrentDirectoryBase,
	directoryExists,
	changeCwd,
	isDirectory,
	getDirectories,
	isDirectoryEmpty,
	readFiles,
	copyFolder,
	copyFile,
	readFile,
	readFileJson,
	writeFile,
	writeFileJson,
	existsOrCreateFolder,
	serial,
};
