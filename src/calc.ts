type FrameRatio = (frame: Rectangle) => Rectangle;

export {FrameRatio, frameRatio, moveToFrame, pointInsideFrame, sizeMatches};

function frameRatio(a: Rectangle, b: Rectangle): FrameRatio {
	const widthRatio = b.width / a.width;
	const heightRatio = b.height / a.height;

	return ({width, height, x, y}) => {
		width = Math.round(width * widthRatio);
		height = Math.round(height * heightRatio);
		x = Math.round(b.x + (x - a.x) * widthRatio);
		y = Math.round(b.y + (y - a.y) * heightRatio);

		return {width, height, x, y};
	};
}

function moveToFrame(a: Rectangle, b: Rectangle): FrameRatio {
	// TODO(mafredri): Try to keep window edges within b.
	return ({width, height, x, y}) => {
		x = b.x + x - a.x;
		y = b.y + y - a.y;
		return {width, height, x, y};
	};
}

function pointInsideFrame(point: Point, frame: Rectangle): boolean {
	return (
		point.x >= frame.x &&
		point.x <= frame.x + frame.width &&
		point.y >= frame.y &&
		point.y <= frame.y + frame.height
	);
}

function sizeMatches(size: Size, match: Size): boolean {
	return (
		Math.abs(size.height - match.height) < 1 &&
		Math.abs(size.width - match.width) < 1
	);
}
