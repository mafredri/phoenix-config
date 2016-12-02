import { pointInsideFrame } from './calc';

function screenAt(point: Point) {
	let screens = Screen.all();

	for (let s of screens) {
		if (pointInsideFrame(point, s.flippedFrame())) {
			return s;
		}
	}
}

// Extend ScreenObject
Screen.at = screenAt;
