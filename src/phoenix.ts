import './screen';
import './window';

import { frameRatio } from './calc';
import { hyper, hyperShift } from './config';
import { onKey } from './key';
import log from './logger';
import brightness from './misc/brightness';
import coffeTimer from './misc/coffee';
import { TimerStopper } from './misc/coffee';
import * as terminal from './misc/terminal';
import { titleModal } from './modal';
import { Scanner } from './scan';

let scanner = new Scanner();
let coffee: TimerStopper;

Phoenix.set({
	daemon: true,
	openAtLogin: true,
});

Event.on('screensDidChange', () => log('Screens changed'));

onKey('tab', hyper, () => {
	let win = Window.focused();
	if (!win) { return; }

	let oldScreen = win.screen();
	let newScreen = oldScreen.next();

	if (oldScreen.isEqual(newScreen)) {
		return;
	}

	let ratio = frameRatio(oldScreen.flippedVisibleFrame(), newScreen.flippedVisibleFrame());
	win.setFrame(ratio(win.frame()));
});

onKey(['left', 'j'], hyper, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, height, x, y } = win.screen().flippedVisibleFrame();
	width = Math.ceil(width / 2);
	win.setFrame({ width, height, x, y });
	win.clearUnmaximized();
});

onKey(['right', 'l'], hyper, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, height, x, y } = win.screen().flippedVisibleFrame();
	width /= 2;
	x += Math.ceil(width);
	width = Math.floor(width);

	win.setFrame({ width, height, x, y });
	win.clearUnmaximized();
});

onKey(['up', 'i'], hyper, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, x } = win.frame();
	let { height, y } = win.screen().flippedVisibleFrame();
	height = Math.ceil(height / 2);

	win.setFrame({ height, width, x, y });
	win.clearUnmaximized();
});

onKey(['down', 'k'], hyper, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, x } = win.frame();
	let { height, y } = win.screen().flippedVisibleFrame();
	height /= 2;
	[height, y] = [Math.ceil(height), y + Math.floor(height)];

	win.setFrame({ height, width, x, y });
	win.clearUnmaximized();
});

onKey('return', hyper, () => {
	let win = Window.focused();
	if (win) {
		win.toggleMaximized();
	}
});

onKey(['left', 'j'], hyperShift, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, height, y } = win.frame();
	let { x } = win.screen().flippedVisibleFrame();

	win.setFrame({ width, height, y, x });
});

onKey(['right', 'l'], hyperShift, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, height, y } = win.frame();
	let { width: sWidth, x } = win.screen().flippedVisibleFrame();

	win.setFrame({
		width, height, y,
		x: x + sWidth - width,
	});
});

onKey(['up', 'i'], hyperShift, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, height, x } = win.frame();
	let { y } = win.screen().flippedVisibleFrame();

	win.setFrame({ width, height, x, y });
});

onKey(['down', 'k'], hyperShift, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, height, x } = win.frame();
	let { height: sHeight, y } = win.screen().flippedVisibleFrame();

	win.setFrame({
		width, height, x,
		y: y + sHeight - height,
	});
});

onKey('return', hyperShift, () => {
	let win = Window.focused();
	if (!win) { return; }

	let { width, height } = win.frame();
	let { width: sWidth, height: sHeight, x, y } = win.screen().flippedVisibleFrame();

	win.setFrame({
		width, height,
		x: x + (sWidth / 2) - (width / 2),
		y: y + (sHeight / 2) - (height / 2),
	});
});

onKey('§', [], () => terminal.toggle());
onKey('§', ['cmd'], () => terminal.cycleWindows());

onKey('delete', hyper, () => {
	let win = Window.focused();
	if (win) {
		win.minimize();
	}
});

onKey('m', hyper, () => {
	let s = Screen.at(Mouse.location());
	if (!s) { return; }

	log(s.identifier(), Mouse.location());
});

onKey('+', hyper, () => brightness(+10));
onKey('-', hyper, () => brightness(-10));

onKey('c', hyper, () => {
	if (coffee) {
		coffee.stop();
		coffee = null;
	} else {
		coffee = coffeTimer({ screen: Screen.main(), timeout: 8 });
	}
});

onKey('space', hyper, () => {
	let m = new Modal();
	let msg = 'Search: ';
	m.text = msg;
	m.showCenterOn(Screen.main());
	const currentWindow = Window.focused();
	let winCache = Window.all({ visible: true });
	let matches = [...winCache];

	const tab = new Key('tab', [], () => {
		if (!matches.length) {
			return;
		}

		const w = matches.shift();
		matches.push(w);
		w.focus();
		m.icon = w.app().icon();
		m.showCenterOn(Screen.main());
	});

	scanner.scanln((s) => {
		m.close();
		tab.disable();
	}, (s) => {
		tab.enable();
		matches = winCache.filter((w) => appName(w) || title(w));
		m.text = msg + s + (s ? results(matches.length) : '');

		if (s && matches.length) {
			matches[0].focus();
			m.icon = matches[0].app().icon();
		} else {
			currentWindow.focus();
			m.icon = null;
		}

		m.showCenterOn(Screen.main());

		function appName(w: Window) {
			return w.app().name().toLowerCase().match(s.toLowerCase());
		}

		function title(w: Window) {
			return w.title().toLowerCase().match(s.toLowerCase());
		}
	});

	function results(n: number) {
		return `\n${n} results`;
	}
});

titleModal('Phoenix (re)loaded!', 2, App.get('Phoenix').icon());
