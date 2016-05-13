export { FrameRatio, frameRatio, pointInsideFrame };

interface FrameRatio {
	(frame: Rectangle): Rectangle;
}

function frameRatio(a: Rectangle, b: Rectangle): FrameRatio {
	let widthRatio = b.width / a.width;
	let heightRatio = b.height / a.height;

	return function ({ width, height, x, y }) {
		width = Math.round(width * widthRatio);
		height = Math.round(height * heightRatio);
		x = Math.round(b.x + (x - a.x) * widthRatio);
		y = Math.round(b.y + (y - a.y) * heightRatio);

		return { width, height, x, y };
	};
}

function pointInsideFrame(point: Point, frame: Rectangle): boolean {
	return point.x >= frame.x && point.x <= (frame.x + frame.width)
		&& point.y >= frame.y && point.y <= (frame.y + frame.height);
}
