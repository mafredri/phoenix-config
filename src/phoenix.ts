import {frameRatio, moveToFrame} from './calc';
import {hyper, hyperShift} from './config';
import {cycleBackward, cycleForward} from './cycle';
import {onKey} from './key';
import log from './logger';
import {brightness} from './misc/brightness';
import {TimerStopper} from './misc/coffee';
import coffeTimer from './misc/coffee';
import * as terminal from './misc/terminal';
import {titleModal, showCenterOn, titleModalOn} from './modal';
import {Scanner} from './scan';
import {setFrame, toggleMaximized} from './window';
import {screenAt} from './screen';
import { window } from 'rxjs/operators';

const phoenixApp = App.get('Phoenix') || App.get('Phoenix (Debug)');
const scanner = new Scanner();
let coffee: TimerStopper | null;

/*
Dev journal

29-06-21
Many simpsons episodes. Implemented simple window adding and rotaties.
Need to do some window hiding to make thing usable
Probably want to store all window hashes so that reloads maintain state
There's something weird about flipped coordinates to work on too. That should get abstracted.
MVP Feature list:
- new window added to current workspace, or apps to workspaces
- switch workspace and hide all other windows
- mod + r to rotate
- mod + left/right to focus monitor
- mod + 1-9 to render workspace 1-9 on active monitor
- mod + shift + left/right to move window to left/right monitor workspace

*/



Phoenix.set({
	daemon: false,
	openAtLogin: true,
});

type WindowProps = {
	x: number
};
let windowMap = new Map<number, WindowProps>();

class Workspace {
	windows: Array<Window> = [];
	id;
	screen : ScreenProxy | null = null;
	mainRatio = 0.8;

	constructor(id: number) {
		this.id = id;
	}

	render() {
		if (!this.screen) {
			throw new Error("render without a screen");
		}
		let screen = this.screen.screen;
		let screenBounds = screen.flippedVisibleFrame();
		log(screenBounds.x + ' '  + screenBounds.y + ' ' + screenBounds.width + ' ' + screenBounds.height );
		let mainWidth = screenBounds.width * this.mainRatio;
		for (let [i, win] of this.windows.entries()) {
			let bounds = Object.assign({}, screenBounds);
			if (i === 0) {
				if (this.windows.length > 1) {
					bounds.width = mainWidth;
				}
			} else {
				let sidebarWindows = this.windows.length - 1;
				bounds.x = screenBounds.x + mainWidth + 1;
				bounds.width = screenBounds.width - mainWidth;
				// TODO sort out the boundary conditions lol
				bounds.height = screenBounds.height / sidebarWindows;;
				bounds.y = screenBounds.y + screenBounds.height / sidebarWindows * (i - 1) + 1;
			}
			log(bounds.x + ' '  + bounds.y + ' ' + bounds.width + ' ' + bounds.height + ' ' + win.title());
			win.setFrame(bounds);
			win.focus();
		}
		if (this.windows.length > 0) {
			this.windows[0].focus();
		}
	}

	rotate() {
		let x = this.windows.pop();
		if (x)
			this.windows.unshift(x);
		log(this.windows.map((w) => w.title()));
		this.modal('Rotating ');
		this.render();
	}

	modal(message: String) {
		let screen = this.screen;
		if (screen) {
			titleModalOn(screen.screen, message + this.id.toString(), 1, phoenixApp && phoenixApp.icon());
		}
	}

	addWindow(window: Window) {
		if (!this.windows.find(w => window == w)) {
			this.windows.push(window);
			if (this.screen) {
				this.render();
			}
			this.modal('Adding window to ');
		} else {
			this.modal('Window already on ');
		}
	}
}
function mapToJson(map) {
	return JSON.stringify([...map]);
}
function jsonToMap(jsonStr: string) {
	return new Map(JSON.parse(jsonStr));
}

let windows = Window.all();
log(Window.all()
		.map((w) => w.hash() + " " + w.title()));

let loadedWorkspaces = Storage.get('workspaces') as Array<Workspace> | undefined;
if (loadedWorkspaces) {
	for (let ws of loadedWorkspaces) {
		log('Workspace ' + ws.id);
		for (let w of ws.windows) {
			log(w.hash());
		}
	}
}

let workspaces : Array<Workspace> = [];
for (let i = 0; i <= 9; i++) {
	workspaces.push(new Workspace(i));
}

class ScreenProxy {
	screen;
	id;
	workspace: Workspace | null = null;
	constructor(screen: Screen, id: number) {
		this.screen = screen;
		this.id = id;
		if (id < 2) {
			this.activateWorkspace(id + 1);
		}
	}

	activateWorkspace(workspaceId: number) {
		if (this.workspace)
			this.workspace.screen = null;

		this.workspace = workspaces[workspaceId];
		this.workspace.screen = this;
		Phoenix.log(this.id + ' ' + this.workspace.id);
		titleModalOn(this.screen, 'Activated ' + workspaceId, 1, phoenixApp && phoenixApp.icon());
	}
}

// We assume that the number of screens does no`t change. Just reload Phoenix.
let screens: Array<ScreenProxy> = [];
for (let [i, screen] of Screen.all().entries()) {
	screens.push(new ScreenProxy(screen, i));
}

function getActiveWorkspace() : Workspace {
	let screen = getActiveScreen();
	return screen.workspace as Workspace;
}

// Collect current window into active workspace. Make this collect app.
onKey('return', ['cmd', 'shift'], () => {
	let window = Window.focused();
	if (window) {
		getActiveWorkspace().addWindow(window);
	}
});

// Rerender current screens.
onKey('space', ['cmd', 'shift'], () => {
	for (let s of screens) {
		(s.workspace as Workspace).render();
	}
});

onKey('r', ['alt'], () => {
	getActiveWorkspace().rotate();
});

onKey('r', ['alt', 'shift'], () => {
	let screenWorkspaces = screens.map(s => s.workspace as Workspace);
	let back = screenWorkspaces.shift() as Workspace;
	screenWorkspaces.push(back);
	screens.forEach((screen, i) => {
		screen.activateWorkspace(screenWorkspaces[i].id);
	});
});


function getActiveScreen() : ScreenProxy {
	let screenId = screens.findIndex((s) => s.screen === Window.focused()?.screen());
	let screen = screens[screenId === -1 ? 0 : screenId];
	return screen;
}

for (let i = 0; i < 9; i++) {
	onKey(i.toString(), ['alt'], () => {
		getActiveScreen().activateWorkspace(i);
	});
	onKey(i.toString(), ['alt', 'shift'], () => {
		let window = Window.focused();
		if (window) {
			workspaces[i].addWindow(window);
		}
	});
}


Event.on('screensDidChange', () => {
	log('Screens changed');
});

onKey('tab', hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const oldScreen = win.screen();
	const newScreen = oldScreen.next();

	if (oldScreen.isEqual(newScreen)) {
		return;
	}

	const ratio = frameRatio(
		oldScreen.flippedVisibleFrame(),
		newScreen.flippedVisibleFrame(),
	);
	setFrame(win, ratio(win.frame()));
});

onKey('tab', hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const oldScreen = win.screen();
	const newScreen = oldScreen.next();

	if (oldScreen.isEqual(newScreen)) {
		return;
	}

	const move = moveToFrame(
		oldScreen.flippedVisibleFrame(),
		newScreen.flippedVisibleFrame(),
	);
	setFrame(win, move(win.frame()));
});

onKey(['left', 'j'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y} = win.screen().flippedVisibleFrame();
	const frame2 = {width: Math.floor(width / 2), height, x, y};
	const frame3 = {width: Math.floor(width / 3), height, x, y};
	const frame4 = {width: Math.floor(width / 4), height, x, y};
	let frame = frame2;
	if (objEq(win.frame(), frame2)) {
		frame = frame3;
	}
	if (objEq(win.frame(), frame3)) {
		frame = frame4;
	}

	setFrame(win, frame);
});

onKey(['right', 'l'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y} = win.screen().flippedVisibleFrame();
	const frame2 = {
		width: Math.floor(width / 2),
		height,
		x: x + Math.ceil(width / 2),
		y,
	};
	const frame3 = {
		width: Math.floor(width / 3),
		height,
		x: x + Math.ceil((width / 3) * 2),
		y,
	};
	const frame4 = {
		width: Math.floor(width / 4),
		height,
		x: x + Math.ceil((width / 4) * 3),
		y,
	};
	let frame = frame2;
	if (objEq(win.frame(), frame2)) {
		frame = frame3;
	}
	if (objEq(win.frame(), frame3)) {
		frame = frame4;
	}

	setFrame(win, frame);
});

onKey(['up', 'i'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, x} = win.frame();
	let {height, y} = win.screen().flippedVisibleFrame();
	height = Math.ceil(height / 2);

	setFrame(win, {height, width, x, y});
});

onKey(['down', 'k'], hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, x} = win.frame();
	let {height, y} = win.screen().flippedVisibleFrame();
	height /= 2;
	[height, y] = [Math.ceil(height), y + Math.floor(height)];

	setFrame(win, {height, width, x, y});
});

onKey('return', hyper, () => {
	const win = Window.focused();
	if (win) {
		toggleMaximized(win);
	}
});

onKey(['left', 'j'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, y, x: fX} = win.frame();
	let {width: sWidth, x} = win.screen().flippedVisibleFrame();

	const center = x + Math.ceil(sWidth / 2);
	const half = Math.floor(width / 2);
	if (fX + half > center) {
		x = center - half;
	}

	setFrame(win, {width, height, y, x});
});

onKey(['right', 'l'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, y, x: fX} = win.frame();
	let {width: sWidth, x} = win.screen().flippedVisibleFrame();

	const center = x + Math.floor(sWidth / 2);
	const half = Math.ceil(width / 2);
	if (fX + half < center) {
		x = center - half;
	} else {
		x = x + sWidth - width;
	}

	setFrame(win, {width, height, y, x});
});

onKey(['up', 'i'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y: frameY} = win.frame();
	let {height: sHeight, y} = win.screen().flippedVisibleFrame();

	const center = Math.ceil(y + sHeight / 2);
	const half = Math.floor(height / 2);
	if (frameY + half > center) {
		y = center - half;
	}

	setFrame(win, {width, height, x, y});
});

onKey(['down', 'k'], hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y: frameY} = win.frame();
	let {height: sHeight, y} = win.screen().flippedVisibleFrame();

	const center = Math.floor(y + sHeight / 2);
	const half = Math.ceil(height / 2);
	if (frameY + half < center) {
		y = center - half;
	} else {
		y = y + sHeight - height;
	}

	setFrame(win, {width, height, x, y});
});

onKey('return', hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height} = win.frame();
	const {
		width: sWidth,
		height: sHeight,
		x,
		y,
	} = win.screen().flippedVisibleFrame();

	setFrame(win, {
		height,
		width,
		x: x + sWidth / 2 - width / 2,
		y: y + sHeight / 2 - height / 2,
	});
});

onKey('§', [], (_, repeated) => {
	if (repeated) {
		return;
	}
	terminal.toggle();
});
onKey('§', ['cmd'], (_, repeated) => {
	if (repeated) {
		return;
	}
	terminal.cycleWindows();
});

onKey('p', hyper, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}
	const app = win.app().name();
	const bundleId = win.app().bundleIdentifier();
	const pid = win.app().processIdentifier();
	const title = win.title();
	const frame = win.frame();
	const msg = [
		`Application: ${app}`,
		`Title: ${title}`,
		`Frame: X=${frame.x}, Y=${frame.y}`,
		`Size: H=${frame.height}, W=${frame.width}`,
		`Bundle ID: ${bundleId}`,
		`PID: ${pid}`,
	].join('\n');

	log('Window information:\n' + msg);

	const modal = Modal.build({
		duration: 10,
		icon: win.app().icon(),
		text: msg,
		weight: 16,
	});
	showCenterOn(modal, Screen.main());
});

onKey('.', hyper, () => {
	const win = Window.focused();
	if (win) {
		log(
			win
				.screen()
				.windows({visible: true})
				.map((w) => w.title()),
		);
		log(
			win
				.screen()
				.windows()
				.map((w) => w.title()),
		);
	}
});

onKey('delete', hyper, () => {
	const win = Window.focused();
	if (win) {
		const visible = win.screen().windows({visible: true});
		log(visible.map((w) => w.title()));
		// log(win.screen().windows({visible: true}).map(w => w.title()));
		// log(win.others({visible: true}).map(w => w.title()));
		win.minimize();
		if (visible.length) {
			const next = visible[visible.length > 1 ? 1 : 0];
			log('focusing: ' + next.title());
			next.focus();
		}
		// win.focusClosestNeighbor('east');
		// const others = win.others({visible: true});
		// if (others.length) {
		// 	log(others.map(w => w.title()));
		// 	others[0].focus();
		// }
	}
});

onKey('m', hyper, () => {
	const s = screenAt(Mouse.location());
	log(s.identifier(), Mouse.location());
});

onKey('=', hyper, () => brightness(+10));
onKey('-', hyper, () => brightness(-10));

onKey('c', hyper, () => {
	if (coffee) {
		coffee.stop();
		coffee = null;
		return;
	}
	coffee = coffeTimer({screen: Screen.main(), timeout: 8});
});

onKey('escape', ['cmd'], () => cycleForward(Window.focused()));
onKey('escape', ['cmd', 'shift'], () => cycleBackward(Window.focused()));

// Experimental: Search for windows and cycle between results.
onKey('space', hyper, () => {
	const m = new Modal();
	const msg = 'Search: ';
	m.text = msg;
	showCenterOn(m, Screen.main());
	const originalWindow = Window.focused();
	const winCache = Window.all({visible: true});
	let matches = [...winCache];

	// Prevent modal from hopping from screen to screen.
	const mainScreen = Screen.main();

	// Since we focus the first window, start in reverse mode.
	let prevReverse = true;

	function nextWindow(reverse: boolean): Window | undefined {
		if (prevReverse !== reverse) {
			prevReverse = reverse;
			nextWindow(reverse); // Rotate.
		}

		const w = reverse ? matches.pop() : matches.shift();
		if (!w) {
			return;
		}
		reverse ? matches.unshift(w) : matches.push(w);
		return w;
	}

	const tabFn = (reverse: boolean) => () => {
		if (!matches.length) {
			return;
		}

		const w = nextWindow(reverse);
		if (!w) {
			return;
		}

		w.focus();
		m.icon = w.app().icon();
		showCenterOn(m, mainScreen);
	};

	const tab = new Key('tab', [], tabFn(false));
	const shiftTab = new Key('tab', ['shift'], tabFn(true));

	scanner.scanln(
		(s) => {
			m.close();
			tab.disable();
			shiftTab.disable();
			if (s === '' && originalWindow) {
				// No window selected, restore original.
				originalWindow.focus();

				// Window management on macOS with multiple monitors is pretty
				// bad, the right window might not be focused when an app is not
				// focused and has multiple windows on multiple monitors.
				setTimeout(() => originalWindow.focus(), 200);
			}
		},
		(s) => {
			tab.enable();
			shiftTab.enable();

			prevReverse = true; // Reset.

			matches = winCache.filter((w) => appName(w) || title(w));
			m.text = msg + s + (s ? results(matches.length) : '');

			if (s && matches.length) {
				matches[0].focus();
				m.icon = matches[0].app().icon();
			} else {
				if (originalWindow) {
					originalWindow.focus();
				}
				m.icon = undefined;
			}

			showCenterOn(m, mainScreen);

			function appName(w: Window) {
				return w.app().name().toLowerCase().match(s.toLowerCase());
			}

			function title(w: Window) {
				return w.title().toLowerCase().match(s.toLowerCase());
			}
		},
	);

	function results(n: number) {
		return `\n${n} results`;
	}
});


// Always hide apps, even if they're the last one on the desktop.
onKey('h', ['cmd'], (_: Key, repeated: boolean) => {
	// Hide all windows when Cmd+H is held.
	if (repeated) {
		const apps = Window.all({visible: true}).map((w) => w.app());
		new Set(apps).forEach((a) => a.hide());
		return;
	}

	const win = Window.focused();
	if (win) {
		win.app().hide();
	}
});

function objEq(a: {[key: string]: any}, b: {[key: string]: any}) {
	const akeys = Object.keys(a);
	if (akeys.length !== Object.keys(b).length) {
		return false;
	}
	return akeys.every((k) => a[k] === b[k]);
}

// titleModal('Phoenix (re)loaded!', 2, phoenixApp && phoenixApp.icon());
