import * as esbuild from 'esbuild';
import {readFileSync, rmSync} from 'fs';

const watch = process.argv.includes('--watch');

// Read target from tsconfig.json
const tsconfig = JSON.parse(
	readFileSync('tsconfig.json', 'utf-8').replace(/,(\s*[}\]])/g, '$1'),
);
const target = tsconfig.compilerOptions?.target?.toLowerCase() ?? 'esnext';

// Clean output directory
rmSync('out', {recursive: true, force: true});

/** @type {esbuild.BuildOptions} */
const common = {
	entryPoints: ['src/phoenix.ts'],
	bundle: true,
	format: 'esm',
	target,
};

/** @type {esbuild.BuildOptions} */
const prod = {
	...common,
	outfile: 'out/phoenix.js',
	minify: true,
	logLevel: 'info',
};

/** @type {esbuild.BuildOptions} */
const debug = {
	...common,
	outfile: 'out/phoenix.debug.js',
	sourcemap: 'inline',
	logLevel: watch ? 'silent' : 'info',
};

if (watch) {
	const [prodCtx, debugCtx] = await Promise.all([
		esbuild.context(prod),
		esbuild.context(debug),
	]);
	await Promise.all([prodCtx.watch(), debugCtx.watch()]);
} else {
	await esbuild.build(prod);
	await esbuild.build(debug);
}
