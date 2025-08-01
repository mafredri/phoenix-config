// @ts-check

import path from 'path';
import webpack from 'webpack';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

export default {
	entry: {
		'phoenix.js': './src/phoenix.ts',
		'phoenix.debug.js': './src/phoenix.ts',
	},
	output: {
		path: path.resolve(import.meta.dirname, 'out'),
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
				include: path.resolve(import.meta.dirname, 'src'),
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
