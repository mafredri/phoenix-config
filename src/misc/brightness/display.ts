import {from, ReplaySubject} from 'rxjs';
import {
	debounceTime,
	distinctUntilChanged,
	switchMap,
	take,
} from 'rxjs/operators';

import log from '../../logger';
import * as dark from '../dark';

import {syncInternalBrightness} from './brightness';
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

const brightnessSubject = new ReplaySubject<number>(1);
const brightnessSubscription = brightnessSubject
	.pipe(
		debounceTime(510),
		distinctUntilChanged(),
		switchMap(v => {
			return from(
				Promise.all([
					applyExternalBrightness(v).then(() => updateBrightness()),
					applyInternalBrightness(v),
					setDarkModeBasedOnBrightness(v),
				]),
			);
		}),
	)
	.subscribe();

let displays: Display[] = [];

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => resolve(), ms);
	});
}

async function updateBrightness(): Promise<number | undefined> {
	try {
		let newDisplays: Display[] = [];
		while (true) {
			newDisplays = await getDisplays();
			if (newDisplays.length === Screen.all().length - 1) {
				break;
			}
			await sleep(1000);
		}

		displays = newDisplays;

		if (!displays.length) {
			return;
		}

		const v = displays
			.map(d => d.current)
			.reduce((a, b) => Math.max(a, b), 0);

		return v;
	} catch (e) {
		log.notify('Refresh displays failed:', e);
	}
}

function syncBrightness() {
	updateBrightness().then(v => {
		if (v !== undefined) {
			applyInternalBrightness(v);
			brightnessSubject.next(v);
		}
	});
}
// TODO: Handle in main script (phoenix.ts).
Event.on('screensDidChange', () => {
	log('screensDidChange', Screen.all().map(s => s.identifier()));
	syncBrightness();
});
syncBrightness();

async function setDarkModeBasedOnBrightness(v: number) {
	const enabled = await dark.isDarkMode();
	if (v <= 40) {
		if (!enabled) {
			dark.enable();
		}
		return;
	}
	if (enabled) {
		dark.disable();
	}
}

async function applyInternalBrightness(v: number) {
	await syncInternalBrightness(v).catch(err =>
		log.notify('Sync internal brightness failed:', err),
	);
}

async function applyExternalBrightness(v: number) {
	await Promise.all(
		displays.map(d => {
			log(d, d.id, v);
			if (d.current === v) {
				return;
			}
			return setBrightness(d.id, v).catch(log.notify);
		}),
	);
}

function brightness(value: number): void {
	brightnessSubject.pipe(take(1)).subscribe(v => {
		v = Math.max(Math.min(v + value, 100), 0);

		showBrightness(v);
		brightnessSubject.next(v);
	});
}
