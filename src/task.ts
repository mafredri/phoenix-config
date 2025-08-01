import log from './logger';

export class TaskError extends Error {
	public task: Task;

	constructor(t: Task, message?: string) {
		super(message);

		this.task = t;
	}

	public toString(): string {
		let extra = `status ${this.task.status}`;
		if (this.task.output.trim() || this.task.error.trim()) {
			const data = {
				error: this.task.error.trim(),
				output: this.task.output.trim(),
				status: this.task.status,
			};
			extra = `${JSON.stringify(data, null, '\t')}`;
		}
		return `Error (Task): ${this.message} (${extra})`;
	}
}

export default async function task(name: string, ...args: string[]) {
	return await taskPromise({allowFailure: false}, name, ...args);
}

export async function taskWithOpts(
	opts: {allowFailure?: boolean} | undefined,
	name: string,
	...args: string[]
) {
	return await taskPromise(opts, name, ...args);
}

const pathCache = new Map<string, Promise<string>>();

// lookPath uses /bin/sh to detect the full path to a command, assumes
// the users login environment contains all relevant PATHs.
export async function lookPath(name: string, retry = false) {
	if (!retry && pathCache.has(name)) {
		return await pathCache.get(name)!;
	}
	const p = new Promise<string>((resolve) => {
		const args = [
			'-c',
			`command -v ${JSON.stringify(name)}`, // Shell safe quoting.
		];
		Task.run('/bin/zsh', args, (t) => {
			if (t.status !== 0) {
				log(
					`lookPath(${name}): failed status=${t.status} stdout=${t.output} stderr=${t.error}`,
				);
				resolve(name);
				pathCache.delete(name);
				return;
			}
			const path = t.output.trim();
			if (path === '') {
				log(
					`lookPath(${name}): BUG: Phoenix returned empty string, retrying...`,
				);
				resolve(lookPath(name, true));
				return;
			}
			log(`lookPath(${name}): ${path}`);
			resolve(path);
		});
	});
	pathCache.set(name, p);

	return await p;
}

async function taskPromise(
	opts: {allowFailure?: boolean} | undefined,
	name: string,
	...args: string[]
): Promise<Task> {
	log(name, args);
	let path = name;
	if (path[0] !== '/') {
		path = await lookPath(name);
	}

	return await new Promise<Task>((resolve, reject) => {
		Task.run(path, args, (t) => {
			// Status 127 means the command was not found,
			// perhaps it was removed or renamed.
			if (t.status === 127 && pathCache.delete(name)) {
				// Try again, but only if an a
				// absolute path wasn't given.
				if (path !== name) {
					return taskPromise(opts, name, ...args).then(
						resolve,
						reject,
					);
				}
			}

			if (!opts?.allowFailure && t.status !== 0) {
				return reject(new TaskError(t, name));
			}
			return resolve(t);
		});
	});
}
