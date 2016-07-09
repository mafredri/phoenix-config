export { titleModal, originOnScreen, applyMargin, Orientation };

enum Orientation {
	NorthWest,
	NorthEast,
	SouthWest,
	SouthEast
}

function titleModal(message: string, duration: number = 1) {
	let m = new Modal();
	m.message = message;
	m.duration = duration;
	m.showTitleOn(Screen.main());
}

Modal.prototype.showTitleOn = function(screen: Screen) {
	showAt(this, screen, 2, 1 + (1 / 3));
};

Modal.prototype.showCenterOn = function(screen: Screen) {
	showAt(this, screen, 2, 2);
};

function showAt(modal: Modal, screen: Screen, widthDiv: number, heightDiv: number) {
	let { height, width } = modal.frame();
	let sf = screen.visibleFrameInRectangle();
	modal.origin = {
		x: sf.x + ((sf.width - width) / widthDiv),
		y: sf.y + ((sf.height - height) / heightDiv),
	};
	modal.show();
}

function originOnScreen(modal: Modal, screen: Screen, orientation: Orientation): Point {
	let { width: mWidth } = modal.frame();
	let { width, height, x, y } = screen.visibleFrameInRectangle();
	let { height: fHeight } = screen.frameInRectangle();

	if (orientation === Orientation.SouthEast) {
		x = x + width - mWidth;
		y = fHeight - height - y;
	} else if (orientation === Orientation.SouthWest) {
		x = 0;
		y = fHeight - height - y;
	}

	return { x, y };
}

function applyMargin({ x, y }: Point, xmargin: number, ymargin: number) {
	x -= xmargin;
	y += ymargin;
	return { x, y };
}
