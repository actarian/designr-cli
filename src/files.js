const fs = require('fs');
const path = require('path');
const spawn = require('spawn-command-with-kill');
const childProcess = require('child_process');

function isDirectory(path) {
	return fs.lstatSync(path).isDirectory();
}

function getDirectories(path) {
	return fs.readdirSync(path).map(name => path.join(path, name)).filter(isDirectory);
}

function nextMinorVersion(version) {
	return version.split('.').map((x, i) => {
		return i === version.split('.').length - 1 ? parseInt(x) + 1 : x;
	}).join('.');
}

function readFiles(folder) {
	return new Promise((resolve, reject) => {
		fs.readdir(folder, (error, files) => {
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

function npmInstall__(folder) {
	return new Promise((resolve, reject) => {
		const previous = process.cwd();
		process.chdir(folder);
		const config = {
			'bin-links': false,
			verbose: true,
			prefix: folder,
		};
		const npm = require('npm');
		npm.load(config, (error) => {
			if (error) {
				return reject(error);
			}
			npm.commands.install([], (error, data) => {
				process.chdir(previous);
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
			npm.on('log', (message) => {
				console.log(message);
			});
		});
	});
}

function child(command) {
	return new Promise((resolve, reject) => {
		const args = command.split(' ');
		const name = args.shift();
		const child = childProcess.spawn(name, args, {
			stdio: 'inherit',
			// stdio: [process.stdin, process.stdout, 'pipe']
		});
		/*
		let errorBuffer = '';
		child.stderr.on('data', function(data) {
			errorBuffer += data;
		});
		*/
		child.on('close', (code) => {
			if (code !== 0) {
				// console.log(`ps process exited with code ${code}`);
				reject(code);
			} else {
				resolve();
			}
		});
		/*
		child.on('error', (err) => {
			console.log('Failed to start subprocess.');
		});
		child.on('exit', (error) => {
			if (!error) {
				resolve();
			} else {
				reject();
			}
		});
		*/
	});
}

function child_(command) {
	return new Promise((resolve, reject) => {
		const childProcess = spawn(command);
		childProcess.stdout.on('data', (data) => {
			process.stdout.write(data);
		});
		childProcess.stderr.on('data', (data) => {
			process.stderr.write(data);
		});
		childProcess.on('exit', (code) => {
			if (code === 0) {
				setTimeout(() => {
					resolve(true);
				}, 1000);
			} else {
				reject();
			}
		});
		childProcess.kill();
	});
}

function serve() {
	return child(`ng serve --open`).then(success => {

	}, error => {
		console.log('');
	});
}

function npmInstall(folder) {
	return child(`npm install --prefix "${folder}"`);
}

function npmPublish(folder) {
	return child(`npm -v --prefix "${folder}"`);
}

function serial(tasks) {
	return tasks.reduce((promise, task) => {
		return promise.then(results => task().then(result => [...results, result]));
	}, Promise.resolve([]));
}

function publish(folder) {
	try {
		if (folder) {
			const _folder = path.resolve(__dirname, folder);
			if (isDirectory(_folder)) {
				const infoPath = `${_folder}/info.json`;
				readFileJson(infoPath)
					.then(info => {
						// info.version = nextMinorVersion(info.version);
						console.warn('\npublishing designr', info.version);
						const directories = getDirectories(_folder);
						const packages = directories.map(folder => {
							// console.log(path.basename(folder));
							const name = path.basename(folder);
							const file = `${folder}/package.json`;
							return readFile(file)
								.then(content => {
									content = content.replace(/(\"version\":\s*\"[\d\.]*\")/g, `\"version\": \"${info.version}\"`);
									return writeFile(content, file);
								});
						});
						const components = directories.map(folder => {
							// console.log(path.basename(folder));
							const name = path.basename(folder);
							const file = `${folder}/src/lib/${name}-module.component.ts`;
							return readFile(file)
								.then(content => {
									content = content.replace(/(\'[\d\.]*\')/g, `'${info.version}'`);
									return writeFile(content, file);
								});
						});
						Promise.all([
								writeFileJson(info, infoPath),
								...packages,
								...components,
							])
							.then(results => {
								return serial(directories.map(x => () => {
										return npmPublish(x);
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
	nextMinorVersion,
	readFiles,
	copyFolder,
	copyFile,
	readFile,
	readFileJson,
	writeFile,
	writeFileJson,
	existsOrCreateFolder,
	npmInstall,
	npmPublish,
	serve,
	serial,
	publish,
};
