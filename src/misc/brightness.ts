import log from '../logger';
import debounce from './debounce';

export default addBrightness;

const ddcctlBinary = '/Users/mafredri/.bin/ddcctl';
const brightnessCmd: string = '/Users/mafredri/.bin/brightness';

// Conservative start value...
let brightnessValue: number = Storage.get('brightness');
let bModal: Modal | null;
let bModalHideHandler: number;

interface Display {
	id: number;
	hash: string;
}

/**
 * refresh updates the current (external) display information.
 */
async function refresh() {
	for (const s of Screen.all()) {
		log(s.identifier(), s.hash());
	}
	try {
		const displays = await ddcctl()
			.then((task) => parseDisplays(task.output));

		const values = (await Promise.all(displays.map((d) => displayBrightness(d.id))))
			.map((t) => parseBrightness(t.output));

		log(displays, values);
	} catch (e) {
		log('Failed to refresh display brightness!', e);
	}
}

refresh();
Event.on('screensDidChange', () => {
	// Give the displays time to settle before querying state.
	setTimeout(refresh, 5000);
});

/**
 * parseDisplays returns all external displays discovered by ddcctl.
 */
function parseDisplays(output: string): Display[] {
	const numMatch = /I: found ([0-9]+) external displays/.exec(output);
	if (numMatch === null) {
		return [];
	}
	const numDisplays = parseInt(numMatch[1], 10);

	const displays: Display[] = [];
	const re = /D: NSScreen #([0-9]+)/gm;

	for (let i = 1; i <= numDisplays; i++) {
		const match = re.exec(output);
		if (match === null) {
			break;
		}
		log(match[1]);
		displays.push({
			hash: match[1],
			id: i,
		});
	}

	return displays;
}

/**
 * parseBrightness fetches the current brightness from the ddcctl command output.
 */
function parseBrightness(output: string): {current: number, max: number} {
	const match = /current: ([0-9]+), max: ([0-9]+)/.exec(output);
	if (!match) {
		throw new Error('could not parse brightness');
	}
	return {
		current: parseInt(match[1], 10),
		max: parseInt(match[2], 10),
	};
}

/**
 * displayBrightness returns brightness when no value is given and sets the
 * brightness when given a value.
 */
function displayBrightness(displayId: number, value?: number): Promise<Task> {
	return ddcctl('-d', String(displayId), '-b', (value ? String(value) : '?'));
}

/**
 * ddcctl runs the ddcctl command with provided arguments.
 */
function ddcctl(...args: string[]): Promise<Task> {
	return new Promise((resolve, reject) => {
		try {
			Task.run(ddcctlBinary, args, (task) => {
				resolve(task);
			});
		} catch (e) {
			reject(e);
		}
	});
}

const debouncedApplyBrightness = debounce(applyBrightness, 500);

function applyBrightness() {
	displayBrightness(1, brightnessValue);
	displayBrightness(2, brightnessValue);
}

function addBrightness(value: number) {
	if (brightnessValue === undefined) {
		brightnessValue = 40;
	}

	if (value < 0) {
		brightnessValue = Math.max(brightnessValue + value, 0);
	} else {
		brightnessValue = Math.min(brightnessValue + value, 100);
	}

	Storage.set('brightness', brightnessValue);

	showBrightness(brightnessValue);
	debouncedApplyBrightness();
}

function showBrightness(value: number) {
	clearTimeout(bModalHideHandler);
	if (!bModal) {
		bModal = new Modal();
	}

	bModal.text = `Brightness: ${value}`;
	bModal.showCenterOn(Screen.main());

	bModalHideHandler = setTimeout(closeBrightnessModal, 1000);
}

function closeBrightnessModal() {
	clearTimeout(bModalHideHandler);
	if (bModal) { bModal.close(); }
	bModal = null;
	bModalHideHandler = 0;
}
