import log from '../logger';
import task from '../task';

export default function osascript(script: string): Promise<string> {
	log(`Executing osascript: ${script}`);
	return task('/usr/bin/osascript', '-e', script)
		.then(t => t.output)
		.catch(err => {
			log.notify(err);
			throw err;
		});
}
