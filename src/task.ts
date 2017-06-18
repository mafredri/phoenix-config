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

export default function task(name: string, ...args: string[]): Promise<Task> {
	return new Promise((resolve, reject) => {
		Task.run(name, args, t => {
			if (t.status !== 0) {
				reject(new TaskError(t, name));
			}
			return resolve(t);
		});
	});
}
