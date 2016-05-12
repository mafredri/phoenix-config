import '';
import log from './logger';

Screen.at = function at(point: Point) {
	let screens = Screen.screens();

	for (let s of screens) {
		let frame = s.frameInRectangle();
		if (point.x >= frame.x && point.x <= (frame.x + frame.width)
			&& point.y >= frame.y && point.y <= (frame.y + frame.height)) {
			return s;
		}
	}
};

function screenRatioAndOffset(screen: Screen, other: Screen): Rectangle {
	let a = screen.visibleFrameInRectangle();
	let b = other.visibleFrameInRectangle();

	log(a, b);
	return {
		height: b.height / a.height,
		width: b.width / a.width,
		x: b.x - a.x,
		y: b.y - b.y,
	}
}

function applyRatioAndOffset(frame: Rectangle, ratio: Rectangle): Rectangle {
	return {
		width: frame.width * ratio.width,
		height: frame.height * ratio.height,
		x: (frame.x * ratio.width) + ratio.x,
		y: (frame.y * ratio.height) + ratio.y,
	};
}

function moveToScreen(win: Window, screen: Screen, frame?: Rectangle) {
	if (!win || !screen) return;

	if (!frame) {
		frame = win.frame();
	}

	let current = win.screen();
	let ratio = screenRatioAndOffset(current, screen);
	log('ratio:', ratio);
	let newFrame = applyRatioAndOffset(frame, ratio);
	log('frame:', frame);
	log('newFrame', newFrame);

	if (win.isMaximized()) {
		// Keep unmaximized frame in sync between screens
		let umFrame = applyRatioAndOffset(win.unmaximizedFrame(), ratio)
		win.setUnmaximizedFrame(umFrame);
	}

	win.setFrame(newFrame);
}

export { moveToScreen };
