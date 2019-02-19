#!/usr/bin/env node

const clear = require('clear');
const chalk = require('chalk');
const clui = require('clui');
const download = require('download-git-repo');
const figlet = require('figlet');
const minimist = require('minimist');

const files = require('./src/files');
const github = require('./src/github');
const repo = require('./src/repo');

class DesignerCli {

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

	async parseCommand() {
		const argv = minimist(process.argv.slice(2));
		const commands = argv._;
		if (commands.length) {
			const command = commands[0];
			switch (commands[0]) {
				case 'new':
					await this.createApp(commands[1]);
					break;
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
				.column(chalk.cyan('new'), 12)
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
		/*
		if (files.directoryExists('.git')) {
			console.log(chalk.red('Already a git repository!'));
			process.exit();
		} else {
			console.log(chalk.red('done!', argv._));
			// this.run();
		}
		*/
	}

	async createApp(appName) {
		appName = appName || 'designr-cli';
		console.log(chalk.red('new'), '=>', chalk.cyan(appName), '\n');
		const status = new clui.Spinner(chalk.cyan('loading...'));
		status.start();
		await new Promise((resolve, reject) => {
			download('actarian/designr-client', 'temp', (error) => {
				setTimeout(() => {
					status.stop();
					if (error) {
						console.log(chalk.cyan(appName), '=>', chalk.red('error'), '\n');
						reject(error);
					} else {
						console.log(chalk.cyan(appName), '=>', chalk.green('success'), '\n');
						resolve(appName);
					}
					return;
				}, 200);
			});
		});
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
