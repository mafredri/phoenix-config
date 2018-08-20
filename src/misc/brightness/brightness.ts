import osascript from '../../misc/osascript';
import task from '../../task';

const brightnessBinary = '/usr/local/bin/brightness';

const delay = (duration: number) =>
	new Promise(resolve => setTimeout(resolve, duration));

/**
 * brightness runs the brightness command with provided arguments.
 */
export function brightness(...args: string[]): Promise<string> {
	return task(brightnessBinary, ...args).then(t => t.output);
}

export function activateDisplayPreferences() {
	const launched = !App.get('System Preferences');
	return osascript(`
		tell application "System Preferences"
			reveal anchor "displaysDisplayTab" of pane "com.apple.preference.displays"
		end tell
	`)
		.then(() => delay(50))
		.then(() => launched);
}

function setBrightness(value: number) {
	value *= 0.01;

	return osascript(`
		tell application "System Events" to tell process "System Preferences" to tell window "Built-in Retina Display"
			set value of value indicator 1 of slider 1 of group 1 of tab group 1 to ${value}
		end tell
	`);
}

/**
 * syncInternalBrightness tries to keep the internal MacBook display brightness
 * in sync with and external Dell U2715H. Takes the external monitor brightness
 * as input and sets the internal display to a matching brightness.
 *
 * These values are approximations based on what *feels* right.
 *
 * We use a few breakpoints with different scales here because there is no 1:1
 * relationship between the brightness setting of the displays.
 */
export function syncInternalBrightness(value: number) {
	if (value > 100 || value < 0) {
		throw new Error('value out of range');
	}

	switch (true) {
		case value < 10:
			// Set brightness in range of [50, 62].
			return setBrightness(35 + (1 + 1 / 3) * value);
		case value < 20:
			return setBrightness(60 + 1 * (value - 10));
		case value < 50:
			// Set brightness in range of [62, 86].
			return setBrightness(69 + 2 / 3 * (value - 20));
		case value >= 50:
			// Set brightness in range of [85, 98.75].
			return setBrightness(85 + 0.275 * (value - 50));
		default:
			throw new Error('unhandled brightness value');
	}
}
