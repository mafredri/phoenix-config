import log from '../logger';
import debounce from './debounce';

export default addBrightness;

const ddcctlBinary = '/Users/mafredri/.bin/ddcctl';
const brightnessCmd: string = '/Users/mafredri/.bin/brightness';

// Conservative start value...
let brightnessValue: number = Storage.get('brightness');
let bModal: Modal | null;
let bModalHideHandler: number;

interface DdcctlDisplay {
	id: number;
	hash: number;
}

interface DisplayBrightness {
	current: number;
	max: number;
}

interface Display extends DdcctlDisplay, DisplayBrightness {
	identifier: string;
}

/**
 * refresh updates the current (external) display information.
 */
async function refresh() {
	const screens = Screen.all();

	const ddcctlDisplays = await ddcctl().then(parseDisplays);
	const brightnessOutput = await Promise.all(
		ddcctlDisplays.map(d => displayBrightness(d.id)),
	);
	const values = brightnessOutput.map(parseBrightness);

	const mergeFunc = mergeDisplayInformation(screens, ddcctlDisplays, values);
	const displays = ddcctlDisplays.map(mergeFunc);
	log(displays);
}

function mergeDisplayInformation(
	screens: Screen[],
	displays: DdcctlDisplay[],
	values: DisplayBrightness[],
): (d: DdcctlDisplay, i: number) => Display {
	return (d, i) => {
		const screen = screens.find(s => s.hash() === d.hash);
		if (!screen) {
			throw new Error(
				`could not find screen for display id: ${d.id}; hash: ${d.hash}`,
			);
		}
		return Object.assign({identifier: screen.identifier()}, d, values[i]);
	};
}

refresh().catch(e => Phoenix.notify('Refresh displays failed: ' + e));
Event.on('screensDidChange', () => {
	// Give the displays time to settle before querying state.
	setTimeout(() => {
		refresh().catch(e => Phoenix.notify('Refresh displays failed: ' + e));
	}, 5000);
});

/**
 * parseDisplays returns all external displays discovered by ddcctl.
 */
function parseDisplays(output: string): DdcctlDisplay[] {
	const numMatch = /I: found ([0-9]+) external displays/.exec(output);
	if (numMatch === null) {
		return [];
	}
	const numDisplays = parseInt(numMatch[1], 10);

	const displays: DdcctlDisplay[] = [];
	const re = /D: NSScreen #([0-9]+)/gm;

	for (let i = 1; i <= numDisplays; i++) {
		const match = re.exec(output);
		if (match === null) {
			break;
		}
		displays.push({
			hash: parseInt(match[1], 10),
			id: i,
		});
	}

	return displays;
}

/**
 * parseBrightness fetches the current brightness from the ddcctl command output.
 */
function parseBrightness(output: string): DisplayBrightness {
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
function displayBrightness(displayId: number, value?: number) {
	const bval = typeof value === 'number' ? String(value) : '?';
	return ddcctl('-d', String(displayId), '-b', bval);
}

/**
 * ddcctl runs the ddcctl command with provided arguments.
 */
function ddcctl(...args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			Task.run(ddcctlBinary, args, task => {
				if (task.status === 0) {
					return resolve(task.output);
				}
				return reject(
					`ddcctl failed with status: ${task.status}; output: ${task.output}; error: ${task.error}`,
				);
			});
		} catch (e) {
			return reject(e);
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

	brightnessValue = Math.max(Math.min(brightnessValue + value, 100), 0);

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
	if (bModal) {
		bModal.close();
	}
	bModal = null;
	bModalHideHandler = 0;
}
