const clear = require('clear');
const chalk = require('chalk');
const clui = require('clui');
const downloadGitRepo = require('download-git-repo');
const figlet = require('figlet');
const inquirer = require('inquirer');
const minimist = require('minimist');
const path = require('path');

const files = require('./files');
const command = require('./command');
const pubver = require('./pubver');
const debug = require('./debug');
const github = require('./github');
const repo = require('./repo');

const pathToGit = 'actarian/designr-client';

class DesignerCli {

	/*
	command     param           description
	create      <appName?>      create a new app
	serve       <target?>       run a development server on target
	build       <target?>       build browser and server for target
	debug       <target?>       debug server for target
	pubver      <version?>    publish a new version to npm
	*/

	/*
	"build:browser:development": "ng build browser --configuration=development",
	"build:browser:staging": "ng build browser --configuration=staging",
	"build:browser:production": "ng build browser --configuration=production",
	"build:server:development": "ng build server --configuration=development && npm run dependency:development:fix",
	"build:server:staging": "ng build server --configuration=staging && npm run dependency:staging:fix",
	"build:server:production": "ng build server --configuration=production && npm run dependency:production:fix",
	"build:development": "npm run build:browser:development & npm run build:server:development",
	"build:staging": "npm run build:browser:staging & npm run build:server:staging",
	"build:production": "npm run build:browser:production & npm run build:server:production",
	"build:docs": "ng build browser --configuration=docs",
	"dependency:development:fix": "node -e \"require('./utils/replace.js')('./dist/development/server/main.js', new RegExp('angular-in.memory-web-api(.[^\\\"]*)', 'gm'), 'angular-in-memory-web-api')\"",
	"dependency:staging:fix": "node -e \"require('./utils/replace.js')('./dist/staging/server/main.js', new RegExp('angular-in.memory-web-api(.[^\\\"]*)', 'gm'), 'angular-in-memory-web-api')\"",
	"dependency:production:fix": "node -e \"require('./utils/replace.js')('./dist/production/server/main.js', new RegExp('angular-in.memory-web-api(.[^\\\"]*)', 'gm'), 'angular-in-memory-web-api')\"",
	"debug:development": "node -e \"require('./utils/debug.js')(require('./dist/development/server/main.js').default, 'https://development.labs.it/')\"",
	"debug:staging": "node -e \"require('./utils/debug.js')(require('./dist/staging/server/main.js').default, 'http://staging.site.it/')\"",
	"debug:production": "node -e \"require('./utils/debug.js')(require('./dist/production/server/main.js').default, 'https://www.site.it/')\""
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
				case 'pubver':
					promise = this.pubver(commands[1]);
					break;
				case 'v':
				case 'version':
					promise = this.version(commands[1]);
					break;
			}
			if (promise) {
				promise.then(success => {
					console.log(chalk.cyan('designr-cli'), '=>', chalk.green('success'));
				}, error => {
					console.log(chalk.red('error'), '=>', chalk.yellow(error));
					process.exit();
				});
			}
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
				.column(chalk.cyan('<appName?>'), 16)
				.column(chalk.green('create a new app'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('serve'), 12)
				.column(chalk.cyan('<target?>'), 16)
				.column(chalk.green('run a development server on target'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('build'), 12)
				.column(chalk.cyan('<target?>'), 16)
				.column(chalk.green('build browser and server for target'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('debug'), 12)
				.column(chalk.cyan('<target?>'), 16)
				.column(chalk.green('debug server for target'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('pubver'), 12)
				.column(chalk.cyan('<version?>'), 16)
				.column(chalk.green('publish a new version to npm'), 40)
				.fill()
				.output();
		}
		console.log('');
	}

	dest_(appName) {
		return process.cwd(); // path.join(process.cwd(), appName, 'Client');
	}

	serve_(appName, dest) {
		return new Promise((resolve, reject) => {
			files.changeCwd(dest);
			command.serve(dest).then((success) => {
				console.log(chalk.cyan(appName), '=>', chalk.green('serve'), '\n');
				resolve(appName);
			}, (error) => {
				reject(error);
			});
		});
	}

	install_(appName, dest) {
		return new Promise((resolve, reject) => {
			console.log(chalk.cyan('installing...\n'));
			command.npmInstall(dest).then((success) => {
				resolve(appName);
			}, (error) => {
				reject(error);
			});
		});
	}

	download_(appName, dest) {
		return new Promise((resolve, reject) => {
			const status = new clui.Spinner(chalk.cyan('loading...'));
			status.start();
			downloadGitRepo(pathToGit, dest, (error) => {
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

	create(appName) {
		appName = appName || 'designr-cli';
		console.log(chalk.red('create'), '=>', chalk.cyan(appName));
		const dest = this.dest_(appName);
		files.isDirectoryEmpty(dest).then(empty => {
			return files.serial([
				() => this.download_(appName, '.'),
				() => this.install_(appName, '.'),
				() => this.serve_(appName, '.')
			]);
		}, error => {
			if (Array.isArray(error)) {
				console.log(chalk.red(`directory is not empty`), '=>', chalk.cyan(`${dest}\n`));
			} else {
				console.log(chalk.red(`${error}\n`));
			}
			process.exit();
		});
		/*
		if (files.directoryExists(dest)) {
			console.log(chalk.red(`directory exist at path`), '=>', chalk.cyan(`${appName}/Client\n`));
			process.exit();
		} else {
			return files.serial([
				() => this.download_(appName, dest),
				() => this.install_(appName, dest),
				() => this.serve_(appName, dest)
			]);
		}
		*/
	}

	serve(target) {
		target = target || 'development';
		console.log(chalk.red('serve'), '=>', chalk.cyan(target), '\n');
		command.serve(target);
	}

	build(target) {
		target = target || 'development';
		console.log(chalk.red('build'), '=>', chalk.cyan(target), '\n');
		command.build(target);
	}

	debug(target) {
		target = target || 'development';
		console.log(chalk.red('debug'), '=>', chalk.cyan(target));
		return debug.run(target).then((result) => {
			process.exit();
		}, error => {
			console.log(chalk.red(`${error}\n`));
			process.exit();
		});
	}

	async pubver(version) {
		return pubver.getNextConfig(version).then(async (config) => {
			console.log(chalk.red('pubver'), '=>', chalk.cyan(config.version), '\n');
			const questions = [{
				name: 'publish',
				type: 'confirm',
				message: `Want to publish version ${config.version}`
			}];
			const result = await inquirer.prompt(questions);
			if (result.publish) {
				pubver.publish(config.version);
			} else {
				console.log('');
				process.exit();
			}
		}, error => {
			console.log(chalk.red(`${error}\n`));
			process.exit();
		});
	}

	version() {
		const infoPath = path.join(__dirname, '..', 'package.json');
		files.readFileJson(infoPath).then(info => {
			console.log(chalk.cyan('@designr/cli'), info.version, '\n');
		}, error => {
			console.log(chalk.red(error), '\n');
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
