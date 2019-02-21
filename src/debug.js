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
		const mainRelativePath = path.join('dist', target, 'server', 'main.js')
		const mainPath = path.join(process.cwd(), mainRelativePath);
		files.exists(mainPath).then(exist => {
			// run(target);
			const main = require(mainRelativePath);
			console.log(main);
			resolve(mainPath);
		}, error => {
			reject(`file /dist/${target}/server/main.js not found`);
		});
	});
}

function run_(callback, baseUrl) {
	console.warn('\nserver main.js => [execution]');
	try {
		if (callback && baseUrl) {
			const params = ['/', {}, baseUrl, '/', { originalHtml: `
			<head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#">
				<meta charset="utf-8">
				<title>Viaggi Eurospin: Un Mondo di Vantaggi</title>
				<base href="/">
				<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes">
				<link rel="icon" type="image/x-icon" href="favicon.ico">
				<link rel="manifest" href="manifest.json">
				<meta name="theme-color" content="#1976d2">
			</head>

			<body>
				<app-component></app-component>
				<noscript>Questa applicazione richiede l'utilizzo di javascript.</noscript>
			</body>

			</html>` }];
			// console.log(params);
			// console.log(process.env);
			let slug = Object.keys(process.env)
				.find(x => x.indexOf('npm_config_slug') === 0);
			slug = slug ? slug.split('npm_config_slug_')[1] : '/';
			// console.log(slug);
			params[3] = slug;
			params.unshift((error, result) => {
				if (error) {
					console.warn('\n/dist/server/main.js => [error]');
					console.log(error);
					console.log(result || '');
				} else {
					console.warn('\n/dist/server/main.js => [result]');
					console.log(result);
				}
			});
			callback.apply(this, params);
		}
	} catch (error) {
		console.warn('\n/dist/server/main.js => [error]');
		console.log(error);
	}
};

module.exports = {
	run,
}
