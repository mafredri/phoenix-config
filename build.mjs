import * as esbuild from 'esbuild';
import {execFileSync} from 'child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'fs';

const watch = process.argv.includes('--watch');

// Read target from tsconfig.json.
const tsconfig = JSON.parse(
	readFileSync('tsconfig.json', 'utf-8').replace(/,(\s*[}\]])/g, '$1'),
);
const target = tsconfig.compilerOptions?.target?.toLowerCase() ?? 'esnext';

// Ensure output directory exists.
mkdirSync('out', {recursive: true});

/** @type {esbuild.Plugin} */
const tscPlugin = {
	name: 'tsc',
	setup(build) {
		build.onStart(() => {
			try {
				execFileSync('pnpm', ['run', 'typecheck'], {
					stdio: 'inherit',
				});
			} catch {
				return {errors: [{text: 'Type check failed'}]};
			}
		});
		build.onEnd((result) => {
			if (result.errors.length > 0) {
				return;
			}
			for (const file of result.outputFiles ?? []) {
				writeFileSync(file.path, file.contents);
			}
		});
	},
};

/** @type {esbuild.BuildOptions} */
const common = {
	entryPoints: ['src/phoenix.ts'],
	bundle: true,
	format: 'esm',
	target,

	// Ensure we only write on success.
	write: false,
	plugins: [tscPlugin],
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
