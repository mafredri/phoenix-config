import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
	{ignores: ['build.mjs', 'out']},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
];
