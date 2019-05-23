const chalk = require('chalk');
const files = require('./files');
const htmlparser2 = require('htmlparser2');
const http = require('http');
const opn = require('opn');
const path = require('path');

const DEFAULT_URL = 'https://eurospin-viaggi2.wslabs.it/'; // 'https://development.labs.it/'
const DEFAULT_SLUG = '/';

/*
"debug:development": "node -e \"require('./utils/debug.js')(require('./dist/development/server/main.js').default, 'https://development.labs.it/')\"",
"debug:staging": "node -e \"require('./utils/debug.js')(require('./dist/staging/server/main.js').default, 'http://staging.site.it/')\"",
"debug:production": "node -e \"require('./utils/debug.js')(require('./dist/production/server/main.js').default, 'https://www.site.it/')\""
*/

function run(target, options) {
	return new Promise((resolve, reject) => {
		target = target || 'development';
		const segments = [...(target === 'docs' ? [target] : ['dist', target, 'server']), 'main.js'];
		const mainPath = path.join(process.cwd(), ...segments);
		files.exists(mainPath).then(exist => {
			// run(target);
			const main = require(mainPath);
			// console.log(main);
			const url = options.url || DEFAULT_URL;
			const slug = options.slug || DEFAULT_SLUG;
			render(main.default, url, slug).then(result => {
				(async () => {
					await open(result);
					resolve(result);
				})();
			}, error => {
				reject(error);
			});
		}, error => {
			reject(`file ${path.join(segments)} not found`);
		});
	});
}

async function open(result) {
	const server = http.createServer((request, response) => {
		response.writeHeader(200, { 'Content-Type': 'text/html' });
		response.write(result.html);
		response.end();
	}).listen(43210);
	console.log(chalk.cyan('listening port 43210...'));
	await opn('http://localhost:43210', { wait: true });
	server.close();
	/*
	await opn('http://localhost:43210');
	*/
}

function parse(result) {
	const names = ['script', 'style'];
	let name, tab = 0;
	const parser = new htmlparser2.Parser({
		onopentag: (tagName, attributes) => {
			name = tagName;
			tab++;
		},
		ontext: (text) => {
			if (names.indexOf(name) === -1) {
				const tabs = new Array(tab).fill(' ').join('');
				console.log(chalk.green(tabs + text));
			}
		},
		onclosetag: (tagName) => {
			tab--;
		}
	}, { decodeEntities: true });
	parser.write(result.html);
	parser.end();
	console.log(Object.keys(result));
}

function render(callback, url, slug) {
	return new Promise((resolve, reject) => {
		try {
			const params = [];
			// console.log(params);
			// console.log(process.env);
			/*
			let slug = Object.keys(process.env)
				.find(x => x.indexOf('npm_config_slug') === 0);
			slug = slug ? slug.split('npm_config_slug_')[1] : '/';
			// console.log(slug);
			params[3] = slug;
			*/
			console.log(chalk.gray('app log start'));
			callback((error, result) => {
				if (error) {
					reject(error);
				} else {
					console.log(chalk.gray('app log complete'));
					console.log(chalk.green('url'), chalk.cyan(url + slug));
					console.log(chalk.green('globals'), chalk.cyan(result.globals));
					console.log(chalk.green('statusCode'), chalk.cyan(result.statusCode));
					console.log(chalk.green('redirectUrl'), chalk.cyan(result.redirectUrl));
					resolve(result);
				}
			}, '/', {}, url, slug, {
				originalHtml: `<!doctype html>
			<html lang="en">

			<head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#">
				<meta charset="utf-8">
				<title>Website Title</title>
				<base href="/">
				<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes">
				<link rel="icon" type="image/x-icon" href="favicon.ico">
				<!-- <link rel="manifest" href="manifest.json"> -->
				<meta name="theme-color" content="#1976d2">
			</head>

			<body>
				<app-component></app-component>
				<noscript>This application requires JavaScript.</noscript>
			</body>

			</html>`
			});

		} catch (error) {
			reject(error);
		}
	});
};

module.exports = {
	run,
};
