const clear = require('clear');
const chalk = require('chalk');
const clui = require('clui');
const compareVersions = require('compare-versions');
const downloadGitRepo = require('download-git-repo');
const figlet = require('figlet');
const minimist = require('minimist');
const path = require('path');
//
const analyzer = require('./analyzer');
const command = require('./command');
const debug = require('./debug');
const explorer = require('./explorer');
const files = require('./files');
const inquirer_ = require('./inquirer');
const pubver = require('./pubver');
const github = require('./_github');
const repo = require('./_repo');
//
const GIT_PATH_DEFAULT = 'actarian/designr-client';
const NODE_VERSION = '10.0.0';
const NPM_VERSION = '5.8.0';
const NG_VERSION = '7.0.0';
//
const EXPLORER = false;
const PUBVER = true;
//
class DesignerCli {

	/*
	command     param           description
	create      <appName?>      create a new app
	serve       <target?>       run a development server on target
	build       <target?>       build browser and server for target
	debug       <target?>       debug server for target
	explorer	<target?>       sourcemap explorer for target
	pubver      <version?>      publish a new version to npm
	*/

	constructor() {
		clear();
		console.log('');
		console.log(
			chalk.cyan(
				figlet.textSync('Designr', {
					font: 'Standard',
					horizontalLayout: 'default',
					verticalLayout: 'default'
				})
			)
		);
		console.log('');
		this.parseCommand();
	}

	parseCommand() {
		const argv = minimist(process.argv.slice(2));
		const commands = argv._;
		if (commands.length) {
			this.checkVersions_().then(success => {
				const command = commands[0];
				let promise;
				switch (commands[0]) {
					case 'create':
						promise = this.create(commands[1]);
						break;
					case 'serve':
						promise = this.serve(commands[1]);
						break;
					case 'build':
						promise = this.build(commands[1]);
						break;
					case 'debug':
						promise = this.debug(commands[1]);
						break;
					case 'analyzer':
						promise = this.analyzer(commands[1]);
						break;
					case 'explorer':
						if (EXPLORER) {
							promise = this.explorer(commands[1]);
						}
						break;
					case 'pubver':
						if (PUBVER) {
							promise = this.pubver(commands[1]);
						}
						break;
					case 'v':
					case 'version':
						promise = this.version(commands[1]);
						break;
				}
				if (promise) {
					promise.then(success => {
						console.log(chalk.cyan('designr-cli:'), chalk.green('success'));
					}, error => {
						if (error !== 1) {
							this.error_(error);
						}
						process.exit();
					});
				} else {
					this.error_(`unknown command ${commands[0]}`);
				}
			}, error => {
				this.error_(error);
			});
		} else {
			new clui.Line()
				.padding(1)
				.column(chalk.red('command'), 12)
				.column(chalk.red('param'), 16)
				.column(chalk.red('description'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('create'), 12)
				.column(chalk.cyan('appName?'), 16)
				.column(chalk.green('create a new app'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('serve'), 12)
				.column(chalk.cyan('target?'), 16)
				.column(chalk.green('run a development server on target'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('build'), 12)
				.column(chalk.cyan('target?'), 16)
				.column(chalk.green('build browser and server for target'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('debug'), 12)
				.column(chalk.cyan('target?'), 16)
				.column(chalk.green('debug server for target'), 40)
				.fill()
				.output();
			if (EXPLORER) {
				new clui.Line()
					.padding(1)
					.column(chalk.cyan('explorer'), 12)
					.column(chalk.cyan('target?'), 16)
					.column(chalk.green('sourcemap explorer for target'), 40)
					.fill()
					.output();
			}
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('analyzer'), 12)
				.column(chalk.cyan('target?'), 16)
				.column(chalk.green('webpack analyzer for target'), 40)
				.fill()
				.output();
			if (PUBVER) {
				new clui.Line()
					.padding(1)
					.column(chalk.cyan('pubver'), 12)
					.column(chalk.cyan('version?'), 16)
					.column(chalk.green('publish a new version to npm'), 40)
					.fill()
					.output();
			}
		}
		console.log('');
	}

	create(appName) {
		return new Promise((resolve, reject) => {
			appName = appName || 'designr-cli';
			console.log(chalk.red('create:'), chalk.cyan(appName));
			const appFolder = this.getAppFolder_(appName);
			files.isDirectoryEmpty(appFolder).then(empty => {
				return files.serial([
					async () => await this.download_(appName, '.'),
						() => this.install_(appName, '.'),
						() => this.serve_(appName, '.')
				]).then(success => resolve(success, error => reject(error)));
			}, error => {
				if (Array.isArray(error)) {
					reject(`directory is not empty ${appFolder}`);
				} else {
					reject(error);
				}
			});
		});
		/*
		if (files.directoryExists(appFolder)) {
			console.log(chalk.red(`directory exist at path:`), chalk.cyan(`${appName}/Client`));
			process.exit();
		} else {
			return files.serial([
				() => this.download_(appName, appFolder),
				() => this.install_(appName, appFolder),
				() => this.serve_(appName, appFolder)
			]);
		}
		*/
	}

	serve(target) {
		target = target || 'development';
		console.log(chalk.red('serve:'), chalk.cyan(target));
		return command.serve(target);
	}

	async build(target) {
		target = target || await inquirer_.askTarget();
		console.log(chalk.red('build:'), chalk.cyan(target));
		return command.build(target);
	}

	async debug(target) {
		target = target || await inquirer_.askTarget();
		console.log(chalk.red('debug:'), chalk.cyan(target));
		return debug.run(target).then((result) => {
			process.exit();
		}, error => {
			this.error_(error);
		});
	}

	async explorer(target) {
		target = target || await inquirer_.askTarget();
		console.log(chalk.red('explorer:'), chalk.cyan(target));
		return explorer.run(target).then((result) => {
			process.exit();
		}, error => {
			this.error_(error);
		});
	}

	async analyzer(target) {
		target = target || await inquirer_.askTarget();
		console.log(chalk.red('analyzer:'), chalk.cyan(target));
		return analyzer.run(target).then((result) => {
			process.exit();
		}, error => {
			this.error_(error);
		});
	}

	async pubver(version) {
		return pubver.getNextConfig(version).then(async (config) => {
			console.log(chalk.red('pubver:'), chalk.cyan(config.version));
			const results = await inquirer_.askPublishConfirm(config.version);
			if (results.publish) {
				pubver.publish(config.version);
			} else {
				console.log('');
				process.exit();
			}
		}, error => {
			console.log(chalk.red('pubver:'), chalk.cyan(process.cwd()));
			this.error_(error);
		});
	}

	version() {
		const infoPath = path.join(__dirname, '..', 'package.json');
		files.readFileJson(infoPath).then(info => {
			console.log(chalk.red('version:'), chalk.cyan('@designr/cli'), info.version);
		}, error => {
			this.error_(error);
		});
	}

	error_(error) {
		console.log(chalk.red('error:'), chalk.yellow(error), '\n');
		process.exit();
	}

	checkVersions_() {
		return new Promise((resolve, reject) => {
			files.serial([
				// () => command.nodeVersion(),
				() => command.npmVersion(),
				// () => command.ngVersion(),
			]).then(versions => {
				// console.log(versions);
				/*
				if (compareVersions(versions[0], NODE_VERSION) === -1) {
					return reject(`node required version >= ${NODE_VERSION}`);
				}
				*/
				if (compareVersions(versions[0], NPM_VERSION) === -1) {
					return reject(`npm required version >= ${NPM_VERSION}`);
				}
				/*
				if (compareVersions(versions[1], NG_VERSION) === -1) {
					return reject(`ng required version >= ${NG_VERSION}`);
				}
				*/
				resolve(versions);
			}, error => {
				reject(error);
			});
		});
	}

	getAppFolder_(appName) {
		return process.cwd(); // path.join(process.cwd(), appName, 'Client');
	}

	serve_(appName, appFolder) {
		return new Promise((resolve, reject) => {
			files.changeCwd(appFolder);
			command.serve(appFolder).then((success) => {
				console.log(chalk.cyan(`${appName}:`), chalk.green('serve'));
				resolve(appName);
			}, (error) => {
				reject(error);
			});
		});
	}

	install_(appName, appFolder) {
		return new Promise((resolve, reject) => {
			console.log(chalk.cyan('installing...'));
			command.npmInstall(appFolder).then((success) => {
				resolve(appName);
			}, (error) => {
				reject(error);
			});
		});
	}

	async download_(appName, appFolder) {
		const results = await inquirer_.askProjectType();
		let path = GIT_PATH_DEFAULT;
		if (results.projectType === 'Default') {
			path = GIT_PATH_DEFAULT;
		}
		return new Promise((resolve, reject) => {
			const status = new clui.Spinner(chalk.cyan('loading...'));
			status.start();
			downloadGitRepo(path, appFolder, (error) => {
				if (error) {
					status.stop();
					reject(error);
				} else {
					status.stop();
					resolve(appName);
				}
			});
		});
	}

	/*
	async getGithubToken() {
		// Fetch token from config store
		const token = github.getStoredGithubToken();
		if (token) {
			return token;
		}
		// No token found, use credentials to access github account
		await github.setGithubCredentials();
		// Check if access token for designr-cli was registered
		const accessToken = await github.hasAccessToken();
		if (accessToken) {
			console.log(chalk.yellow('An existing access token has been found!'));
			// ask user to regenerate a new token
			token = await github.regenerateNewToken(accessToken.id);
			return token;
		}
		// No access token found, register one now
		token = await github.registerNewToken();
		return token;
	}

	async run() {
		try {
			// Retrieve & Set Authentication Token
			const token = await getGithubToken();
			github.githubAuth(token);
			// Create remote repository
			const url = await repo.createRemoteRepo();
			// Create .gitignore file
			await repo.createGitignore();
			// Setup local repository and push to remote
			const done = await repo.setupRepo(url);
			if (done) {
				console.log(chalk.green('All done!'));
			}
		} catch (err) {
			if (err) {
				switch (err.code) {
					case 401:
						console.log(chalk.red('Couldn\'t log you in. Please provide correct credentials/token.'));
						break;
					case 422:
						console.log(chalk.red('There already exists a remote repository with the same name'));
						break;
					default:
						console.log(err);
				}
			}
		}
	}
	*/

}

module.exports = DesignerCli;
