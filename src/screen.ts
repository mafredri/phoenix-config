import { frameRatio } from './calc';

export { moveToScreen };

function moveToScreen(win: Window, screen: Screen) {
	if (!win || !screen) return;

	let current = win.screen();
	let ratio = frameRatio(current.visibleFrameInRectangle(), screen.visibleFrameInRectangle());

	if (win.isMaximized()) {
		// Keep unmaximized frame in sync between screens
		let umFrame = ratio(win.unmaximizedFrame());
		win.setUnmaximizedFrame(umFrame);
	}

	win.setFrame(ratio(win.frame()));
}
