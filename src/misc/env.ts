export function getEnv(name: string): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!name) {
			return reject('no variable name provided');
		}

		Task.run('/bin/sh', ['-c', `echo "$${name}"`], (t) => {
			if (t.status === 0) {
				return resolve(t.output);
			} else {
				return reject(`could not execute command to fetch '$${name}'`);
			}
		});
	});
}
