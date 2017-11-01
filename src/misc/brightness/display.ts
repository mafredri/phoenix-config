import log from '../../logger';
import debounce from '../debounce';

import {getDisplays, setBrightness} from './ddcctl';
import {showBrightness} from './modal';

interface DisplayIdentifier {
	id: number;
	hash: number;
}

interface DisplayBrightness {
	current: number;
	max: number;
}

interface Display extends DisplayIdentifier, DisplayBrightness {
	identifier: string;
}

export {Display, DisplayBrightness, DisplayIdentifier};
export {brightness};

// TODO: Refactor to avoid reliance on single global.
let brightnessValue = 0;

function updateBrightnessValue(): void {
	getDisplays()
		.then(displays => {
			brightnessValue = displays
				.map(d => d.current)
				.reduce((a, b) => Math.max(a, b), 0);
		})
		.catch(e => log.notify('Refresh displays failed:', e));
}

// TODO: Handle in main script (phoenix.ts).
updateBrightnessValue();
const debouncedUpdateBrightnessValue = debounce(
	updateBrightnessValue,
	1000 * 7,
);
Event.on('screensDidChange', () => {
	// Give the displays time to settle before querying state.
	debouncedUpdateBrightnessValue();
});

const debouncedApplyBrightness = debounce(applyBrightness, 510);
function applyBrightness() {
	setBrightness(1, brightnessValue);
	setBrightness(2, brightnessValue);
}

function brightness(value: number): void {
	brightnessValue = Math.max(Math.min(brightnessValue + value, 100), 0);

	showBrightness(brightnessValue);
	debouncedApplyBrightness();
}
