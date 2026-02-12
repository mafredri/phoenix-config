import {frameAlmostEq, objEq, retry} from './util';
import {frameRatio} from './calc';
import log from './logger';

export {setFrame, maximize, toggleMaximized};

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
	// Cleanup references to unmaximized window frames.
	frameCache.delete(win.hash());
});

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

function isMaximized(win: Window): boolean {
	const cache = frameCache.get(win.hash());
	if (!cache || !cache.maximized) {
		return false;
	}

	log(win.frame(), cache.maximized.window);

	return (
		objEq(win.screen().flippedVisibleFrame(), cache.maximized.screen) &&
		objEq(win.frame(), cache.maximized.window)
	);
}

async function toggleMaximized(win: Window): Promise<boolean> {
	if (isMaximized(win)) {
		return setFrame(win, unmaximizedFrame(win));
	}
	return maximize(win);
}

async function setFrame(win: Window, frame: Rectangle): Promise<boolean> {
	let prevFrame = frame;
	if (
		!(await retry(() => {
			if (win.setFrame(frame)) {
				return true;
			}

			// macOS may constrain the height by 1px (e.g. when the dock is visible),
			// accept the frame if it's off by one.
			const newFrame = win.frame();
			if (frameAlmostEq(newFrame, frame)) {
				return true;
			}

			// If the frame keeps changing between setFrames, we want to keep
			// retrying, but otherwise let's just give up gracefully.
			if (objEq(newFrame, prevFrame)) {
				log(
					'Set window frame did not reach target but frame became stable:',
					win.title(),
					frame,
				);
				return true;
			}
			prevFrame = newFrame;

			return false;
		}))
	) {
		log.notify('Set window frame failed:', win.title(), frame);

		// If the window still changed size, let's clear the cache.
		if (!objEq(prevFrame, frame)) {
			frameCache.delete(win.hash());
		}
		return false;
	}

	frameCache.delete(win.hash());
	return true;
}

async function maximize(win: Window): Promise<boolean> {
	const previous = {
		screen: win.screen().flippedVisibleFrame(),
		window: win.frame(),
	};
	if (!(await retry(() => win.maximize()))) {
		log.notify('Maximize window failed:', win.title());
		return false;
	}
	const id = win.hash();
	frameCache.set(id, {
		...previous,
		maximized: {
			screen: win.screen().flippedVisibleFrame(),
			window: win.frame(),
		},
	});
	return true;
}
