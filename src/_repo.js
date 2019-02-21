const _ = require('lodash');
const fs = require('fs');
const git = require('simple-git')();
const clui = require('clui');
const touch = require('touch');

const inquirer = require('./_inquirer');
const gh = require('./_github');

module.exports = {

	createRemoteRepo: async () => {
		const github = gh.getInstance();
		const answers = await inquirer.askRepoDetails();
		const data = {
			name: answers.name,
			description: answers.description,
			private: (answers.visibility === 'private')
		};
		const status = new clui.Spinner('Creating remote repository...');
		status.start();
		try {
			const response = await github.repos.create(data);
			return response.data.ssh_url;
		} catch (err) {
			throw err;
		} finally {
			status.stop();
		}
	},

	createGitignore: async () => {
		const filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore');
		if (filelist.length) {
			const answers = await inquirer.askIgnoreFiles(filelist);
			if (answers.ignore.length) {
				fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
			} else {
				touch('.gitignore');
			}
		} else {
			touch('.gitignore');
		}
	},

	setupRepo: async (url) => {
		const status = new clui.Spinner('Initializing local repository and pushing to remote...');
		status.start();
		try {
			await git
				.init()
				.add('.gitignore')
				.add('./*')
				.commit('Initial commit')
				.addRemote('origin', url)
				.push('origin', 'master');
			return true;
		} catch (err) {
			throw err;
		} finally {
			status.stop();
		}
	}

};