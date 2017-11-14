import {pointInsideFrame} from './calc';

function screenAt(point: Point) {
	const screens = Screen.all();

	for (const s of screens) {
		if (pointInsideFrame(point, s.flippedFrame())) {
			return s;
		}
	}

	throw new Error('point out of range');
}

// Extend ScreenObject.
Screen.at = screenAt;
