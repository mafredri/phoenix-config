import {Subject} from 'rxjs';
import {debounceTime, tap} from 'rxjs/operators';
import log from './logger';
import {showCenterOn} from './modal';

enum Direction {
	Forward,
	Backward,
}

const focused: Map<number, number> = new Map();

let modal = new Modal();
const closeModal = new Subject<void>();
const closeModalSubscription = closeModal
	.pipe(
		debounceTime(2000),
		tap(() => {
			modal.close();
			modal = new Modal();
		}),
	)
	.subscribe();

export function cycleForward(win?: Window) {
	return cycle(Direction.Forward, win);
}

export function cycleBackward(win?: Window) {
	return cycle(Direction.Backward, win);
}

function cycle(dir: Direction, win?: Window) {
	if (!win) {
		return;
	}

	const app = win.app();
	const others = app
		.windows()
		// A window without a title is usually unfocusable,
		// true for e.g. Finder, Chrome, etc.
		.filter((w) => w.title() !== '' && !w.isMinimized());

	// Do nothing when there is only one window.
	if (others.length < 2) {
		return;
	}

	if (dir === Direction.Forward) {
		updateTimestamp(win);
	} else if (dir === Direction.Backward) {
		resetTimestamp(win);
	} else {
		throw new Error('Unknown Direction: ' + dir);
	}

	const order = cycleWindows(dir, others);

	log(order.map((w) => w.hash() + ' - ' + w.title()));

	const next = order[0];
	modal.weight = 18;
	modal.text = next.title();
	modal.icon = app.icon();
	showCenterOn(modal, next.screen());
	next.focus();
	closeModal.next();
}

function updateTimestamp(w: Window) {
	focused.set(w.hash(), +new Date());
}

function resetTimestamp(w: Window) {
	focused.delete(w.hash());
}

function getTimestamp(w: Window) {
	return focused.get(w.hash()) || 0;
}

function cycleWindows(dir: Direction, w: Window[]): Window[] {
	switch (dir) {
		case Direction.Forward:
			return [...w].sort(leastRecentlyFocused);
		case Direction.Backward:
			return [...w].reverse().sort(mostRecentlyFocused);
		default:
			throw new Error('Unknown Direction: ' + dir);
	}
}

function leastRecentlyFocused(a: Window, b: Window) {
	const [at, bt] = [getTimestamp(a), getTimestamp(b)];
	if (at === bt) {
		return 0;
	}
	if (at < bt) {
		return -1;
	}
	return 1;
}

function mostRecentlyFocused(a: Window, b: Window) {
	const [at, bt] = [getTimestamp(a), getTimestamp(b)];
	if (at === bt) {
		return 0;
	}
	if (at > bt) {
		return -1;
	}
	return 1;
}
