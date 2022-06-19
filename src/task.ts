interface TaskData {
	error: string;
	output: string;
	status: number;
}

export class TaskError extends Error {
	public task: Task;

	constructor(t: Task, message?: string) {
		super(message);

		this.task = t;
	}

	public toString(): string {
		let extra = `status ${this.task.status}`;
		if (this.task.output || this.task.error) {
			const data: TaskData = {
				error: this.task.error,
				output: this.task.output,
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

// lookPath uses /bin/sh to detect the full path to a command, assumes
// the users login environment contains all relevant PATHs.
export async function lookPath(name: string) {
	const t = await task('/bin/sh', '-c', `command -v ${name}`);
	if (t.status === 0) {
		return t.output.trim();
	}
	throw new TaskError(t, name);
}

function taskPromise(
	opts: {allowFailure?: boolean} | undefined,
	name: string,
	...args: string[]
): Promise<Task> {
	if (name[0] !== '/') {
		return lookPath(name).then((n) => taskPromise(opts, n, ...args));
	}

	return new Promise((resolve, reject) => {
		Task.run(name, args, (t) => {
			if (!opts?.allowFailure && t.status !== 0) {
				reject(new TaskError(t, name));
			}
			return resolve(t);
		});
	});
}
