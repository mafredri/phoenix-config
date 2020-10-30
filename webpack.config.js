const path = require('path');

module.exports = [
	{
		mode: 'production',
		entry: './src/phoenix.ts',
		output: {
			path: path.resolve(__dirname, 'out'),
			filename: 'phoenix.js',
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
	},
	{
		mode: 'development',
		entry: './src/phoenix.ts',
		devtool: 'inline-source-map',
		output: {
			path: path.resolve(__dirname, 'out'),
			filename: 'phoenix.debug.js',
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
	},
];
