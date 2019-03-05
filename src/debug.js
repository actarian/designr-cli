const path = require('path');
const files = require('./files');

/*
"debug:development": "node -e \"require('./utils/debug.js')(require('./dist/development/server/main.js').default, 'https://development.labs.it/')\"",
"debug:staging": "node -e \"require('./utils/debug.js')(require('./dist/staging/server/main.js').default, 'http://staging.site.it/')\"",
"debug:production": "node -e \"require('./utils/debug.js')(require('./dist/production/server/main.js').default, 'https://www.site.it/')\""
*/

function run(target) {
	return new Promise((resolve, reject) => {
		target = target || 'development';
		const segments = [...(target === 'docs' ? [target] : ['dist', target, 'server']), 'main.js'];
		const mainPath = path.join(process.cwd(), ...segments);
		files.exists(mainPath).then(exist => {
			// run(target);
			const main = require(mainPath);
			// console.log(main);
			render(main.default, 'https://development.labs.it/').then(result => {
				resolve(result);
			}, error => {
				reject(error);
			});
		}, error => {
			reject(`file ${path.join(segments)} not found`);
		});
	});
}

function render(callback, baseUrl) {
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
			callback((error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			}, '/', {}, baseUrl, '/', {
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
