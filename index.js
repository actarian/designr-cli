#!/usr/bin/env node

const clear = require('clear');
const chalk = require('chalk');
const clui = require('clui');
const downloadGitRepo = require('download-git-repo');
const figlet = require('figlet');
const minimist = require('minimist');
const path = require('path');

const files = require('./src/files');
const github = require('./src/github');
const repo = require('./src/repo');

const pathToGit = 'actarian/designr-client';

class DesignerCli {

	/*
	command     param           description
	create      <appName?>      create a new app
	serve       <target?>       run a development server on target
	build       <target?>       build browser and server for target
	pubver      <pathToLib?>    publish a new version to npm
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
				case 'pubver':
					promise = this.pubver(commands[1]);
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
				.column(chalk.green('command'), 12)
				.column(chalk.green('param'), 16)
				.column(chalk.green('description'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('create'), 12)
				.column(chalk.cyan('<appName?>'), 16)
				.column(chalk.white('create a new app'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('serve'), 12)
				.column(chalk.cyan('<target?>'), 16)
				.column(chalk.white('run a development server on target'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('build'), 12)
				.column(chalk.cyan('<target?>'), 16)
				.column(chalk.white('build browser and server for target'), 40)
				.fill()
				.output();
			new clui.Line()
				.padding(1)
				.column(chalk.cyan('pubver'), 12)
				.column(chalk.cyan('<pathToLib?>'), 16)
				.column(chalk.white('publish a new version to npm'), 40)
				.fill()
				.output();
		}
		console.log('');
	}

	serve_(appName, targetPath) {
		return new Promise((resolve, reject) => {
			files.changeCwd(targetPath);
			files.serve(targetPath).then((success) => {
				console.log(chalk.cyan(appName), '=>', chalk.green('serve'), '\n');
				resolve(appName);
			}, (error) => {
				reject(error);
			});
		});
	}

	install_(appName, targetPath) {
		return new Promise((resolve, reject) => {
			console.log(chalk.cyan('installing...\n'));
			files.npmInstall(targetPath).then((success) => {
				resolve(appName);
			}, (error) => {
				reject(error);
			});
		});
	}

	download_(appName, targetPath) {
		return new Promise((resolve, reject) => {
			const status = new clui.Spinner(chalk.cyan('loading...'));
			status.start();
			downloadGitRepo(pathToGit, targetPath, (error) => {
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
		console.log(chalk.red('new'), '=>', chalk.cyan(appName), '\n');
		const targetPath = path.join(process.cwd(), appName, 'Client');
		if (files.directoryExists(targetPath)) {
			console.log(chalk.red(`directory exist at path`), '=>', chalk.cyan(`${appName}/Client\n`));
			process.exit();
		} else {
			return files.serial([
				() => this.download_(appName, targetPath),
				() => this.install_(appName, targetPath),
				() => this.serve_(appName, targetPath)
			]);
		}
	}

	serve(target) {
		console.log(chalk.red('serve'), '=>', chalk.cyan(target || 'default'));
		files.serve();
	}

	build(target) {
		console.log('build', target);
	}

	pubver(pathToLib) {
		console.log('pubver', pathToLib);
	}

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

}

const cli = new DesignerCli();
