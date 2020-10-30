const path = require('path');
const webpack = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	entry: {
		'phoenix.js': './src/phoenix.ts',
		'phoenix.debug.js': './src/phoenix.ts',
	},
	output: {
		path: path.resolve(__dirname, 'out'),
		filename: '[name]',
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				include: path.resolve(__dirname, 'src'),
				options: {
					transpileOnly: true,
				},
			},
		],
	},
	plugins: [
		new webpack.ProgressPlugin(),
		new CleanWebpackPlugin(),
		new ForkTsCheckerWebpackPlugin(),
	],
};
