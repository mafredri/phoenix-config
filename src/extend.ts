import { pointInsideFrame } from './calc';

Screen.at = function at(point: Point) {
	let screens = Screen.screens();

	for (let s of screens) {
		if (pointInsideFrame(point, s.frameInRectangle()) {
			return s;
		}
	}
};
