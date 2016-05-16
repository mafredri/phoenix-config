import { titleModal } from './modal';
import { moveToScreen } from './screen';
import { enforceKeyhandlersEnabled } from './util';
import log from './logger';
import brightness from './brightness';
import coffeTimer from './coffee';
import { Scanner } from './scan';
import './window';
import './extend';

// Export handlers so that the references are kept within Phoenix
export let keyHandlers: KeyHandler[];
export let eventHandlers: EventHandler[];
export let modeKeyHandler: KeyHandler[];

let hyper: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt'];
let hyperShift: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt', 'shift'];
let scanner = new Scanner();

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

		let oldScreen = win.screen();
		let newScreen = oldScreen.next();

		if (oldScreen.isEqual(newScreen)) return;

		moveToScreen(win, newScreen);
	}),

	Phoenix.bind('left', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, x, y } = win.screen().visibleFrameInRectangle();
		width = Math.ceil(width / 2);
		win.setFrame({ width, height, x, y });
		win.clearPosition();
	}),

	Phoenix.bind('right', hyper, () => {
		let win = Window.focusedWindow();
		if (!win) return;

		let { width, height, x, y } = win.screen().visibleFrameInRectangle();
		width /= 2;
		x += Math.ceil(width);
		width = Math.floor(width);

		win.setFrame({ width, height, x, y });
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
		height /= 2;
		[ height, y ] = [ Math.ceil(height), y + Math.floor(height) ];

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

	Phoenix.bind('c', hyper, () => {
		coffeTimer();
	}),

	Phoenix.bind('space', hyper, () => {
		scanner.scanln(s => log('DONE:', s), s => log('UPDATE:', s));
	}),

	Phoenix.bind('v', hyper, () => {
		scanner.scan(s => log('DONE:', s));
	}),
];

titleModal('Phoenix (re)loaded!');

enforceKeyhandlersEnabled(keyHandlers);
