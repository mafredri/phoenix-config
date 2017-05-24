import { frameRatio, sizeMatches } from './calc';
import log from './logger';

export { toggleMaximized, clearUnmaximized };

interface FrameCache {
	screen: Rectangle;
	window: Rectangle;
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

function toggleMaximized(win: Window) {
	const id = win.hash();
	if (frameCache.has(id)) {
		win.setFrame(unmaximizedFrame(win));
		win.clearUnmaximized();
		return;
	}
	frameCache.set(id, {
		screen: win.screen().flippedVisibleFrame(),
		window: win.frame(),
	});
	win.maximize();
}

Window.prototype.clearUnmaximized = function _clearUnmaximized() { clearUnmaximized(this); };
Window.prototype.toggleMaximized = function _toggleMaximized() { toggleMaximized(this); };
