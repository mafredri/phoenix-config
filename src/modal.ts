enum Orientation {
	NorthWest,
	NorthEast,
	SouthWest,
	SouthEast,
}

export {titleModal, originOnScreen, applyMargin, Orientation};

function titleModal(text: string, duration: number = 1, icon?: Phoenix.Icon) {
	const m = new Modal();
	m.text = text;
	m.duration = duration;
	if (icon) {
		m.icon = icon;
	}
	m.showTitleOn(Screen.main());
}

Modal.prototype.showTitleOn = function _showTitleOn(screen: Screen) {
	showAt(this, screen, 2, 1 + 1 / 3);
};

Modal.prototype.showCenterOn = function _showCenterOn(screen: Screen) {
	showAt(this, screen, 2, 2);
};

function showAt(
	modal: Modal,
	screen: Screen,
	widthDiv: number,
	heightDiv: number,
) {
	const {height, width, x, y} = modal.frame();
	const sf = screen.visibleFrame();
	modal.origin = {
		x: sf.x + (sf.width / widthDiv - width / 2),
		y: sf.y + (sf.height / heightDiv - height / 2),
	};
	modal.show();
}

function originOnScreen(
	modal: Modal,
	screen: Screen,
	orientation: Orientation,
): Point {
	const {width: mWidth, height: mHeight} = modal.frame();
	let {width, height, x, y} = screen.visibleFrame();

	if (orientation === Orientation.SouthEast) {
		x = x + width - mWidth;
		y = y;
	} else if (orientation === Orientation.SouthWest) {
		x = x;
		y = y;
	}

	return {x, y};
}

function applyMargin(
	{x, y}: Point,
	screen: Screen,
	xmargin: number,
	ymargin: number,
) {
	const f = screen.visibleFrame();
	if (x < f.x + f.width / 2) {
		x += xmargin;
	} else {
		x -= xmargin;
	}
	if (y < f.y + f.height / 2) {
		y += ymargin;
	} else {
		y -= ymargin;
	}
	return {x, y};
}
