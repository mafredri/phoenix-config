import log from '../../logger';
import task from '../../task';
import debounce from '../debounce';

import {Display, DisplayBrightness, DisplayIdentifier} from './display';

export {getBrightness, setBrightness, getDisplays, Display};

const ddcctlBinary = '/Users/maf/.bin/ddcctl';

/**
 * getDisplays updates the current (external) display information.
 */
async function getDisplays(): Promise<Display[]> {
	const displays = await ddcctl().then(parseDisplays);
	const values = await Promise.all(displays.map(d => getBrightness(d.id)));

	return displays.map(merge(Screen.all(), values));
}

/**
 * parseDisplays returns all external displays discovered by ddcctl.
 */
function parseDisplays(output: string): DisplayIdentifier[] {
	const numMatch = /I: found ([0-9]+) external displays?/.exec(output);
	if (numMatch === null) {
		return [];
	}
	const numDisplays = parseInt(numMatch[1], 10);

	const displays: DisplayIdentifier[] = [];
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
 * merge returns a mapping function that transforms a DisplayIdentifier
 * to a Display.
 */
function merge(
	screens: Screen[],
	values: DisplayBrightness[],
): (d: DisplayIdentifier, i: number) => Display {
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

function setBrightness(displayId: number, value: number) {
	return displayBrightness(displayId, value);
}

function getBrightness(displayId: number) {
	return displayBrightness(displayId);
}
/**
 * displayBrightness returns brightness when no value is given and sets the
 * brightness when given a value.
 */
function displayBrightness(
	displayId: number,
	value?: number,
): Promise<DisplayBrightness> {
	const bval = typeof value === 'number' ? String(value) : '?';
	return ddcctl('-d', String(displayId), '-b', bval).then(parseBrightness);
}

/**
 * ddcctl runs the ddcctl command with provided arguments.
 */
function ddcctl(...args: string[]): Promise<string> {
	return task(ddcctlBinary, ...args).then(t => t.output);
}
