import log from './logger';

enum Orientation {
	NorthWest,
	NorthEast,
	SouthWest,
	SouthEast,
}

export {
	titleModal,
	titleModalOn,
	originOnScreen,
	applyMargin,
	showCenterOn,
	showTitleOn,
	Orientation,
};

function titleModal(text: string, duration: number = 1, icon?: Phoenix.Icon) {
	titleModalOn(Screen.main(), text, duration, icon);
}

function titleModalOn(screen: Screen, text: string, duration: number = 1, icon?: Phoenix.Icon) {
	const m = new Modal();
	m.text = text;
	m.duration = duration;
	if (icon) {
		m.icon = icon;
	}
	showTitleOn(m, screen);
}

/**
 * Show modal in title position on screen.
 */
function showTitleOn(modal: Modal, screen: Screen) {
	showAt(modal, screen, 2, 1 + 1 / 3);
}

/**
 * Show modal in center position on screen.
 */
function showCenterOn(modal: Modal, screen: Screen) {
	showAt(modal, screen, 2, 2);
}

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
	log(modal.origin);
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
