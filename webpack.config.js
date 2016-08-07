module.exports = {
	entry: './src/phoenix.ts',
	output: {
		filename: 'out/phoenix.js',
	},
	resolve: {
		extensions: ['', '.webpack.js', '.ts', '.js'],
	},
	module: {
		loaders: [
			{ test: /\.ts$/, loader: 'ts-loader' },
		],
	},
};
