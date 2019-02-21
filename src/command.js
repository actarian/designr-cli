const path = require('path');
const spawn = require('spawn-command-with-kill');
const childProcess = require('child_process');

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

function build(target) {
	return child(`npm run build:${target}`).then(success => {

	}, error => {
		console.log('');
	});
}

function pubver(target) {
	return child(`npm run build:${target}`).then(success => {

	}, error => {
		console.log('');
	});
}

function npmInstall(folder) {
	return child(`npm install`); // --prefix "${folder}"
}

function npmPublish(folder) {
	return child(`npm -v --prefix "${folder}"`);
}

module.exports = {
	npmInstall,
	npmPublish,
	serve,
	build,
	pubver,
};
