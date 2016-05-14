import { sizeMatches } from './calc';
import log from './logger';

let frameCache: Map<number, Rectangle> = new Map();

// Export handlers so that the references are kept within Phoenix
export const eventHandler: EventHandler[] = [
	Phoenix.on('windowDidClose', (win: Window) => {
		// Cleanup references to unmaximized window frames
		frameCache.delete(win.hash());
	}),
];

// FIXME: This is too hacky, I'd prefer not to monkey patch built-ins
let setFrameOrig = Window.prototype.setFrame;
Window.prototype.setFrame = function(frame: Rectangle): boolean {
	let ret = setFrameOrig.call(this, frame);
	if (this.app().bundleIdentifier() === 'com.microsoft.Word') {
		// Workaround for Microsoft Word resizing too slowly and thus not
		// reaching the correct frame
		while (!sizeMatches(this.frame(), frame)) {
			log('com.microsoft.Word workaround triggered, reapplying setFrame()');
			ret = setFrameOrig.call(this, frame);
		}
	}
	return ret;
};

Window.prototype.clearPosition = function clearPosition() {
	frameCache.delete(this.hash());
};

Window.prototype.isMaximized = function isMaximized() {
	return frameCache.has(this.hash());
};

Window.prototype.unmaximizedFrame = function unmaximizedFrame() {
	return frameCache.get(this.hash());
};

Window.prototype.setUnmaximizedFrame = function setUnmaximizedFrame(frame: Rectangle) {
	frameCache.set(this.hash(), frame);
};

Window.prototype.toggleMaximized = function toggleMaximized() {
	let id = this.hash();
	if (frameCache.has(id)) {
		this.setFrame(frameCache.get(id));
		this.clearPosition();
	} else {
		frameCache.set(id, this.frame());
		this.maximize();
	}
};
