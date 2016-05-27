import { pointInsideFrame } from './calc';

function screenAt(point: Point) {
	let screens = Screen.screens();

	for (let s of screens) {
		if (pointInsideFrame(point, s.frameInRectangle())) {
			return s;
		}
	}
}

// Extend ScreenObject
Screen.at = screenAt;

class PositionHandler {
	private screenStore: Map<string, Object>;
	private store: Map<number, Object>;

	constructor() {
		this.screenStore = new Map();
		this.store = new Map();
	}

	changed(win: Window) {
		let window = Object.assign({}, win.frame());
		let screen = Object.assign({}, win.screen().visibleFrameInRectangle());
		this.store.set(win.hash(), {window, screen});
	}
	remove(win: Window) {
		this.store.delete(win.hash());
	}
}
