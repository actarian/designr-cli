const path = require('path');
// const spawn = require('spawn-command-with-kill');
const childProcess = require('child_process');
const files = require('./files');

function child(command, silent) {
	return new Promise((resolve, reject) => {
		const args = command.split(' ');
		const name = args.shift();
		const child = childProcess.spawn(name, args, {
			stdio: silent ? 'pipe' : 'inherit',
			// stdio: [process.stdin, process.stdout, 'pipe']
		});
		let result = '';
		if (silent) {
			child.stdout.on('data', function(data) {
				result += data.toString();
			});
		}
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
				resolve(result);
			}
		});
		child.on('error', (err) => {
			reject(`Failed to spawn command ${command}`);
		});
		/*
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

function nodeVersion() {
	return new Promise((resolve, reject) => {
		child(`node -v`, true).then(success => {
			resolve(success.replace('\n', ''));
		}, error => {
			reject(error);
		});
	});
}

function npmVersion() {
	return new Promise((resolve, reject) => {
		child(`npm -v`, true).then(success => {
			resolve(success.replace('\n', ''));
		}, error => {
			reject(error);
		});
	});
}

function ngVersion() {
	return new Promise((resolve, reject) => {
		child(`ng version`, true).then(success => {
			const matches = String(success).match(/Angular\sCLI\:\s(.*)\n/);
			resolve(matches.length > 1 ? matches[1] : null);
		}, error => {
			reject(error);
		});
	});
}

function sourceMapExplorerVersion() {
	return new Promise((resolve, reject) => {
		child(`npx source-map-explorer --version`, true).then(success => {
			resolve(success.replace('\n', ''));
		}, error => {
			reject(error);
		});
	});
}

function sourceMapExplorer(src) {
	return child(`npx source-map-explorer ${src}`);
}

function sourceMapExplorerInstall(folder) {
	return child(`npm install source-map-explorer -g`);
}

function bundleAnalyzerVersion() {
	return new Promise((resolve, reject) => {
		child(`npx webpack-bundle-analyzer --version`, true).then(success => {
			resolve(success.replace('\n', ''));
		}, error => {
			reject(error);
		});
	});
}

function bundleAnalyzer(src) {
	return child(`npx webpack-bundle-analyzer ${src}`);
}

function bundleAnalyzerInstall(folder) {
	return child(`npm install webpack-bundle-analyzer -g`);
}

function npmInstall(folder) {
	return child(`npm install`); // --prefix "${folder}"
}

function npmPublish(folder) {
	// return child(`npm -v --prefix "${folder}"`);
	return child(`npm publish ${folder} --access public`);
}

function serve() {
	return new Promise((resolve, reject) => {
		files.exists(path.join(process.cwd(), 'angular.json')).then(success => {
			child(`ng serve --open`).then(success => {
				resolve(success);
			}, error => {
				reject(error);
			});
		}, error => {
			reject(`angular.json missing at path ${process.cwd()}`);
		});
	});
}

function build(target) {
	return new Promise((resolve, reject) => {
		files.exists(path.join(process.cwd(), 'angular.json')).then(success => {
			const tasks = target === 'docs' ? [
				() => child(`ng build browser --configuration=${target}`),
			] : [
				() => child(`ng build browser --configuration=${target}`),
				() => child(`ng build server --configuration=${target}`),
				() => files.replace(`./dist/${target}/server/main.js`, new RegExp('angular-in.memory-web-api(.[^\\\"]*)', 'gm'), 'angular-in-memory-web-api'),
			];
			return files.serial(tasks).then(success => {
				resolve(success);
			}, error => {
				reject(error);
			});
		}, error => {
			reject(`angular.json missing at path ${process.cwd()}`);
		});
	});
}

module.exports = {
	build,
	child,
	ngVersion,
	nodeVersion,
	npmInstall,
	npmPublish,
	npmVersion,
	serve,
	sourceMapExplorer,
	sourceMapExplorerInstall,
	sourceMapExplorerVersion,
	bundleAnalyzer,
	bundleAnalyzerInstall,
	bundleAnalyzerVersion,
};

/*
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
*/
