import { frameRatio } from './calc';
import { titleModal } from './modal';
import log from './logger';
import brightness from './misc/brightness';
import coffeTimer from './misc/coffee';
import { TimerStopper } from './misc/coffee';
import { Scanner } from './scan';
import * as terminal from './misc/terminal';
import './window';
import './extend';
import './screen';

let hyper: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt'];
let hyperShift: Phoenix.ModifierKey[] = ['cmd', 'ctrl', 'alt', 'shift'];
let scanner = new Scanner();
let coffee: TimerStopper;

Phoenix.set({
	'daemon': true,
	'openAtLogin': true,
});

Event.on('screensDidChange', () => log('Screens changed'));

Key.on('tab', hyper, () => {
	let win = Window.focused();
	if (!win) return;

	let oldScreen = win.screen();
	let newScreen = oldScreen.next();

	if (oldScreen.isEqual(newScreen)) return;

	let ratio = frameRatio(oldScreen.flippedVisibleFrame(), newScreen.flippedVisibleFrame());
	win.setFrame(ratio(win.frame()));
});

Key.on('left', hyper, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, height, x, y } = win.screen().flippedVisibleFrame();
	width = Math.ceil(width / 2);
	win.setFrame({ width, height, x, y });
	win.clearUnmaximized();
});

Key.on('right', hyper, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, height, x, y } = win.screen().flippedVisibleFrame();
	width /= 2;
	x += Math.ceil(width);
	width = Math.floor(width);

	win.setFrame({ width, height, x, y });
	win.clearUnmaximized();
});

Key.on('up', hyper, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, x } = win.frame();
	let { height, y } = win.screen().flippedVisibleFrame();
	height = Math.ceil(height / 2);

	win.setFrame({ height, width, x, y });
	win.clearUnmaximized();
});

Key.on('down', hyper, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, x } = win.frame();
	let { height, y } = win.screen().flippedVisibleFrame();
	height /= 2;
	[ height, y ] = [ Math.ceil(height), y + Math.floor(height) ];

	win.setFrame({ height, width, x, y });
	win.clearUnmaximized();
});

Key.on('return', hyper, () => {
	let win = Window.focused();
	if (win) {
		win.toggleMaximized();
	}
});

Key.on('left', hyperShift, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, height, y } = win.frame();
	let { x } = win.screen().flippedVisibleFrame();

	win.setFrame({ width, height, y, x });
});

Key.on('right', hyperShift, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, height, y } = win.frame();
	let { width: sWidth, x } = win.screen().flippedVisibleFrame();

	win.setFrame({
		width, height, y,
		x: x + sWidth - width,
	});
});

Key.on('up', hyperShift, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, height, x } = win.frame();
	let { y } = win.screen().flippedVisibleFrame();

	win.setFrame({ width, height, x, y });
});

Key.on('down', hyperShift, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, height, x } = win.frame();
	let { height: sHeight, y } = win.screen().flippedVisibleFrame();

	win.setFrame({
		width, height, x,
		y: y + sHeight - height,
	});
});

Key.on('return', hyperShift, () => {
	let win = Window.focused();
	if (!win) return;

	let { width, height } = win.frame();
	let { width: sWidth, height: sHeight, x, y } = win.screen().flippedVisibleFrame();

	win.setFrame({
		width, height,
		x: x + (sWidth / 2) - (width / 2),
		y: y + (sHeight / 2) - (height / 2),
	});
});

Key.on('§', [], () => terminal.toggle());
Key.on('§', ['cmd'], () => terminal.cycleWindows());

Key.on('delete', hyper, () => {
	let win = Window.focused();
	if (win) {
		win.minimize();
	}
});

Key.on('m', hyper, () => {
	let s = Screen.at(Mouse.location());
	if (!s) return;

	log(s.identifier(), Mouse.location());
});

Key.on('+', hyper, () => brightness(+10));
Key.on('-', hyper, () => brightness(-10));

Key.on('c', hyper, () => {
	if (coffee) {
		coffee.stop();
		coffee = null;
	} else {
		coffee = coffeTimer({ screen: Screen.main(), timeout: 8 });
	}
});

Key.on('space', hyper, () => {
	let m = new Modal();
	let msg = 'Search: ';
	m.text = msg;
	m.showCenterOn(Screen.main());
	scanner.scanln(s => {
		m.close();
	}, s => {
		m.text = msg + s;
		m.showCenterOn(Screen.main());
	});
});

titleModal('Phoenix (re)loaded!');
