import {frameRatio, sizeMatches} from './calc';
import log from './logger';

export {toggleMaximized, clearUnmaximized};

interface FrameCache {
	screen: Rectangle;
	window: Rectangle;
	maximized?: {
		screen: Rectangle;
		window: Rectangle;
	};
}

const frameCache: Map<number, FrameCache> = new Map();

Event.on('windowDidClose', (win: Window) => {
	// Cleanup references to unmaximized window frames
	frameCache.delete(win.hash());
});

function clearUnmaximized(win: Window) {
	frameCache.delete(win.hash());
}

function unmaximizedFrame(win: Window): Rectangle {
	let c = frameCache.get(win.hash());
	if (!c) {
		c = {
			screen: win.screen().flippedVisibleFrame(),
			window: win.frame(),
		};
	}
	const ratio = frameRatio(c.screen, win.screen().flippedVisibleFrame());
	return ratio(c.window);
}

function objEqual(a: {[key: string]: any}, b: {[key: string]: any}): boolean {
	if (typeof a !== 'object') {
		return a === b;
	}
	if (Object.keys(a).length !== Object.keys(b).length) {
		return false;
	}
	for (const key of Object.keys(a)) {
		if (typeof a[key] === 'object') {
			if (!objEqual(a[key], b[key])) {
				return false;
			}
		}
		if (a[key] !== b[key]) {
			return false;
		}
	}
	return true;
}

function isMaximized(win: Window): boolean {
	const cache = frameCache.get(win.hash());
	if (!cache || !cache.maximized) {
		return false;
	}

	log(win.frame(), cache.maximized.window);

	return (
		objEqual(win.screen().flippedVisibleFrame(), cache.maximized.screen) &&
		objEqual(win.frame(), cache.maximized.window)
	);
}

function toggleMaximized(win: Window) {
	if (isMaximized(win)) {
		win.setFrame(unmaximizedFrame(win));
		win.clearUnmaximized();
		return;
	}
	const previous = {
		screen: win.screen().flippedVisibleFrame(),
		window: win.frame(),
	};
	win.maximize();

	const id = win.hash();
	frameCache.set(id, {
		...previous,
		maximized: {
			screen: win.screen().flippedVisibleFrame(),
			window: win.frame(),
		},
	});
}

function setFrame(win: Window, frame: Rectangle): boolean {
	const ok = win.setFrame(frame);
	if (ok) {
		// Invalidate cache.
		// No maximized.
	}
	return ok;
}

function maximize(win: Window): boolean {
	const ok = win.maximize();
	return ok;
}

Window.prototype.clearUnmaximized = function _clearUnmaximized() {
	clearUnmaximized(this);
};
Window.prototype.toggleMaximized = function _toggleMaximized() {
	toggleMaximized(this);
};
