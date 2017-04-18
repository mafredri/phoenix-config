module.exports = {
	entry: './src/phoenix.ts',
	output: {
		filename: 'out/phoenix.js',
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		loaders: [
			{ test: /\.ts$/, loader: 'ts-loader' },
		],
	},
};
