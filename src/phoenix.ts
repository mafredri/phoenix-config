import { titleModal } from './modal';
import { moveToScreen } from './screen';
import log from './logger';
import brightness from './brightness';
import './window';

// Export handlers so that the references are kept within Phoenix
export let keyHandlers: KeyHandler[];
export let eventHandlers: EventHandler[];

let hyper: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt'];
let hyperShift: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt', 'shift'];

Phoenix.set({
	'daemon': true,
	'openAtLogin': true
});

eventHandlers = [
	Phoenix.on('screensDidChange', () => {
		log('Screens changed');
	}),
];

keyHandlers = [
	Phoenix.bind('tab', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let oldScreen = win.screen()
		let newScreen = oldScreen.next();

		if (oldScreen.isEqual(newScreen)) return;

		moveToScreen(win, newScreen);
	}),

	Phoenix.bind('left', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let frame = win.screen().visibleFrameInRectangle();
		frame.width = Math.ceil(frame.width / 2);
		win.setFrame(frame);
		win.clearPosition();
	}),

	Phoenix.bind('right', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let frame = win.screen().visibleFrameInRectangle();
		frame.width /= 2;
		frame.x += Math.ceil(frame.width);
		frame.width = Math.floor(frame.width);

		win.setFrame(frame);
		win.clearPosition();
	}),

	Phoenix.bind('up', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, x } = win.frame();
		let { height, y } = win.screen().visibleFrameInRectangle();
		height = Math.ceil(height / 2);

		win.setFrame({ height, width, x, y });
		win.clearPosition();
	}),

	Phoenix.bind('down', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, x } = win.frame();
		let { height, y } = win.screen().visibleFrameInRectangle();
		[ height, y ] = [ Math.ceil(height / 2), y + Math.floor(height / 2) ];

		win.setFrame({ height, width, x, y });
		win.clearPosition();
	}),

	Phoenix.bind('return', hyper, () => {
		Window.focusedWindow() && Window.focusedWindow().toggleMaximized();
	}),

	Phoenix.bind('m', hyper, () => {
		let s = Screen.at(Mouse.location());
		if (!s) return;

		log(s.identifier(), Mouse.location());
	}),

	Phoenix.bind('+', hyper, () => {
		brightness(+10);
	}),
	Phoenix.bind('-', hyper, () => {
		brightness(-10);
	}),
];

titleModal('Phoenix (re)loaded!');
