import log from './logger';
import debounce from './misc/debounce';

enum Direction {
	Forward,
	Backward,
}

const focused: Map<number, number> = new Map();

let modal = new Modal();
const closeModal = debounce(() => {
	modal.close();
	modal = new Modal();
}, 2000);

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
		.filter(w => w.title() !== '');

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

	log(order.map(w => w.hash() + ' - ' + w.title()));

	const next = order[0];
	modal.weight = 18;
	modal.text = `${next.title()} - ${app.name()}`;
	modal.text = order
		.map(w => (w.isEqual(next) ? '=> ' : '') + w.title())
		.join('\n');
	modal.icon = app.icon();
	modal.showCenterOn(next.screen());
	next.focus();
	closeModal();
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
