import {pointInsideFrame} from './calc';

export {screenAt};

/**
 * Returns the screen at the provided point.
 */
function screenAt(point: Point) {
	const screens = Screen.all();

	for (const s of screens) {
		if (pointInsideFrame(point, s.flippedFrame())) {
			return s;
		}
	}

	throw new Error('point out of range');
}
