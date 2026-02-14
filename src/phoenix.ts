import {frameRatio, moveToFrame} from './calc';
import {hyper, hyperShift} from './config';
import {cycleBackward, cycleForward} from './cycle';
import {onKey} from './key';
import log from './logger';
import coffeeTimer, {TimerStopper} from './misc/coffee';
import * as terminal from './misc/terminal';
import {showCenterOn, titleModal} from './modal';
// import {Scanner} from './scan';
import {screenAt} from './screen';
import {frameAlmostEq, sleep} from './util';
import {setFrame, toggleMaximized} from './window';
// import * as lgtv from './misc/lgtv';

// const scanner = new Scanner();
let coffee: TimerStopper | null;

Phoenix.set({
	daemon: true,
	openAtLogin: true,
});

Event.on('screensDidChange', () => {
	log('Screens changed');
});

// MouseAction WIP.
interface MouseAction {
	type: 'move' | 'resize';
	win: Window;
	wf: Rectangle;
	screen: Screen;
	sf: Rectangle;
	mp: MousePoint;
}

let enableMouseAction = false;
let mouseAction: MouseAction | undefined;

const enableMouseActionHandler: (handler: Key, repeated: boolean) => void = (
	_,
	repeat,
) => {
	if (repeat) {
		return;
	}
	enableMouseAction = !enableMouseAction;
};

function hasMouseModifiers(
	{modifiers}: {modifiers: Phoenix.ModifierKey[]},
	compare: Phoenix.ModifierKey[],
): boolean {
	return (
		Math.ceil(modifiers.length / 2) == compare.length &&
		compare.map((key) => modifiers.includes(key)).every((x) => x)
	);
}

const mouseActionHandler: (target: MousePoint, handler: Event) => void = (
	target,
) => {
	let type: 'move' | 'resize';
	if (enableMouseAction && hasMouseModifiers(target, hyper)) {
		type = 'move';
	} else if (enableMouseAction && hasMouseModifiers(target, hyperShift)) {
		type = 'resize';
	} else {
		enableMouseAction = false;
		mouseAction = undefined;
		return;
	}
	if (!mouseAction) {
		let win = Window.at(target);
		if (!win) {
			win = Window.focused();
			if (!win) {
				return;
			}
		}
		const screen = win.screen();
		mouseAction = {
			type,
			win,
			wf: win.frame(),
			screen,
			sf: screen.flippedVisibleFrame(),
			mp: {...target},
		};
	} else if (mouseAction.type !== type) {
		// Reset origin on type change because
		// resizing the old frame is weird.
		const screen = mouseAction.win.screen();
		mouseAction = {
			type,
			win: mouseAction.win,
			wf: mouseAction.win.frame(),
			screen,
			sf: screen.flippedVisibleFrame(),
			mp: {...target},
		};
	}
	const x = mouseAction.mp.x - target.x;
	const y = mouseAction.mp.y - target.y;
	if (x === 0 && y === 0) {
		return;
	}
	log(mouseAction.win.screen().flippedVisibleFrame());
	const nf = {...mouseAction.wf};
	if (type === 'move') {
		if (target.y === 0) {
			// TODO: Make it non-instant, revert if dragged back.
			mouseAction.win.maximize();
			return;
		}
		nf.x -= x;
		nf.y -= y;
		// Handle sticky edges.
		const stickyThreshold = 15;
		if (Math.abs(mouseAction.sf.x - nf.x) <= stickyThreshold) {
			nf.x = mouseAction.sf.x;
		}
		const rx = mouseAction.sf.x + mouseAction.sf.width - nf.width;
		if (Math.abs(rx - nf.x) <= stickyThreshold) {
			nf.x = rx;
		}
		if (Math.abs(mouseAction.sf.y - nf.y) <= stickyThreshold) {
			nf.y = mouseAction.sf.y;
		}
		const by = mouseAction.sf.y + mouseAction.sf.height - nf.height;
		if (Math.abs(by - nf.y) <= stickyThreshold) {
			nf.y = by;
		}

		// Snap to the bottom screen edge (below Dock) as well.
		const sby =
			mouseAction.screen.flippedFrame().y +
			mouseAction.screen.flippedFrame().height -
			nf.height;
		if (sby !== by && Math.abs(sby - nf.y) <= stickyThreshold) {
			nf.y = sby;
		}

		mouseAction.win.setTopLeft(nf);

		const currentScreen = mouseAction.win.screen();
		if (!currentScreen.isEqual(mouseAction.screen)) {
			mouseAction.screen = currentScreen;
			mouseAction.sf = currentScreen.flippedVisibleFrame();
		}
	} else {
		const screenRight = mouseAction.sf.x + mouseAction.sf.width;
		const screenBottom = mouseAction.sf.y + mouseAction.sf.height;

		nf.width -= x;
		nf.height -= y;

		// Clamp right/bottom to screen, adjust position to fit.
		const right = Math.min(mouseAction.wf.x + nf.width, screenRight);
		const bottom = Math.min(mouseAction.wf.y + nf.height, screenBottom);
		nf.x = right - nf.width;
		nf.y = bottom - nf.height;

		// Clamp left/top to screen, adjust size to fit.
		if (nf.x < mouseAction.sf.x) {
			nf.x = mouseAction.sf.x;
			nf.width = right - nf.x;
		}
		if (nf.y < mouseAction.sf.y) {
			nf.y = mouseAction.sf.y;
			nf.height = bottom - nf.y;
		}

		mouseAction.win.setFrame(nf);

		// Prevent drift when window has size constraints.
		const actualFrame = mouseAction.win.frame();
		const threshold = 2;

		const widthChanged =
			Math.abs(actualFrame.width - mouseAction.wf.width) >= threshold;
		const heightChanged =
			Math.abs(actualFrame.height - mouseAction.wf.height) >= threshold;

		if (!widthChanged) {
			mouseAction.wf.x = actualFrame.x;
			mouseAction.wf.width = actualFrame.width;
			mouseAction.mp.x = target.x;
		}
		if (!heightChanged) {
			mouseAction.wf.y = actualFrame.y;
			mouseAction.wf.height = actualFrame.height;
			mouseAction.mp.y = target.y;
		}
	}
};

Event.on('mouseDidMove', mouseActionHandler);
onKey('a', hyper, enableMouseActionHandler);
onKey('a', hyperShift, enableMouseActionHandler);

async function moveWindowToScreen(
	win: Window,
	newScreen: Screen,
	scaleWindow: boolean = true,
): Promise<void> {
	const fullscreen = win.isFullScreen();
	if (fullscreen) {
		win.setFullScreen(false);
		// If we don't wait until the animation is finished,
		// bad things will happen (at least with VS Code).
		//
		// 750ms seems to work, but just to be safe.
		await sleep(900);
	}

	const oldScreen = win.screen();

	if (oldScreen.isEqual(newScreen)) {
		return;
	}

	const transform = scaleWindow
		? frameRatio(
				oldScreen.flippedVisibleFrame(),
				newScreen.flippedVisibleFrame(),
			)
		: moveToFrame(
				oldScreen.flippedVisibleFrame(),
				newScreen.flippedVisibleFrame(),
			);

	const frame = transform(win.frame());
	await setFrame(win, frame);

	if (fullscreen) {
		await sleep(900);
		win.setFullScreen(true);
	}

	// Force space switch, in case another one is focused on the screen.
	win.focus();
}

onKey('tab', hyper, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}
	await moveWindowToScreen(win, win.screen().next(), true);
});

onKey('tab', hyperShift, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}
	await moveWindowToScreen(win, win.screen().previous(), true);
});

onKey(['left', 'j'], hyper, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y} = win.screen().flippedVisibleFrame();
	const frame2 = {width: Math.floor(width / 2), height, x, y};
	const frame3 = {width: Math.floor(width / 3), height, x, y};
	const frame4 = {width: Math.floor(width / 4), height, x, y};
	const winFrame = win.frame();
	let frame = frame2;
	if (frameAlmostEq(winFrame, frame2)) {
		frame = frame3;
	}
	if (frameAlmostEq(winFrame, frame3)) {
		frame = frame4;
	}

	await setFrame(win, frame);
});

onKey(['right', 'l'], hyper, async () => {
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
	const winFrame = win.frame();
	let frame = frame2;
	if (frameAlmostEq(winFrame, frame2)) {
		frame = frame3;
	}
	if (frameAlmostEq(winFrame, frame3)) {
		frame = frame4;
	}

	await setFrame(win, frame);
});

onKey(['up', 'i'], hyper, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, x} = win.frame();
	const {height, y} = win.screen().flippedVisibleFrame();
	const newHeight = Math.ceil(height / 2);

	await setFrame(win, {height: newHeight, width, x, y});
});

onKey(['down', 'k'], hyper, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, x} = win.frame();
	let {height, y} = win.screen().flippedVisibleFrame();
	height /= 2;
	[height, y] = [Math.ceil(height), y + Math.floor(height)];

	await setFrame(win, {height, width, x, y});
});

onKey('return', hyper, async () => {
	const win = Window.focused();
	if (win) {
		await toggleMaximized(win);
	}
});

onKey(['left', 'j'], hyperShift, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, y, x: fX} = win.frame();
	const {x} = win.screen().flippedVisibleFrame();

	// TODO(mafredri): Move to next screen when at the edge.
	await setFrame(win, {width, height, y, x: Math.max(x, fX - width)});
});

onKey(['right', 'l'], hyperShift, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, y, x: fX} = win.frame();
	const {width: sWidth, x} = win.screen().flippedVisibleFrame();

	const sEdge = x + sWidth - width;

	// TODO(mafredri): Move to next screen when at the edge.
	await setFrame(win, {
		width,
		height,
		y,
		x: Math.min(sEdge, fX + width),
	});
});

onKey(['up', 'i'], hyperShift, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y: frameY} = win.frame();
	const {y} = win.screen().flippedVisibleFrame();

	// TODO(mafredri): Move to next screen when at the edge.
	await setFrame(win, {width, height, x, y: Math.max(y, frameY - height)});
});

onKey(['down', 'k'], hyperShift, async () => {
	const win = Window.focused();
	if (!win) {
		return;
	}

	const {width, height, x, y: frameY} = win.frame();
	const {height: sHeight, y} = win.screen().flippedVisibleFrame();

	const sEdge = y + sHeight - height;

	// TODO(mafredri): Move to next screen when at the edge.
	await setFrame(win, {
		width,
		height,
		x,
		y: Math.min(sEdge, frameY + height),
	});
});

onKey('return', hyperShift, () => {
	const win = Window.focused();
	if (!win) {
		return;
	}
	win.setFullScreen(!win.isFullScreen());
});

onKey('space', hyperShift, async () => {
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

	await setFrame(win, {
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

onKey('forwardDelete', hyper, () => {
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

onKey('c', hyper, () => {
	if (coffee) {
		coffee.stop();
		coffee = null;
		return;
	}
	coffee = coffeeTimer({screen: Screen.main(), timeout: 8});
});

onKey('escape', ['cmd'], () => cycleForward(Window.focused()));
onKey('escape', ['cmd', 'shift'], () => cycleBackward(Window.focused()));

// Experimental: Search for windows and cycle between results.
// onKey('space', hyper, () => {
// 	const m = new Modal();
// 	const msg = 'Search: ';
// 	m.text = msg;
// 	showCenterOn(m, Screen.main());
// 	const originalWindow = Window.focused();
// 	const winCache = Window.all({visible: true});
// 	let matches = [...winCache];

// 	// Prevent modal from hopping from screen to screen.
// 	const mainScreen = Screen.main();

// 	// Since we focus the first window, start in reverse mode.
// 	let prevReverse = true;

// 	function nextWindow(reverse: boolean): Window | undefined {
// 		if (prevReverse !== reverse) {
// 			prevReverse = reverse;
// 			nextWindow(reverse); // Rotate.
// 		}

// 		const w = reverse ? matches.pop() : matches.shift();
// 		if (!w) {
// 			return;
// 		}
// 		reverse ? matches.unshift(w) : matches.push(w);
// 		return w;
// 	}

// 	const tabFn = (reverse: boolean) => () => {
// 		if (!matches.length) {
// 			return;
// 		}

// 		const w = nextWindow(reverse);
// 		if (!w) {
// 			return;
// 		}

// 		w.focus();
// 		m.icon = w.app().icon();
// 		showCenterOn(m, mainScreen);
// 	};

// 	const tab = new Key('tab', [], tabFn(false));
// 	const shiftTab = new Key('tab', ['shift'], tabFn(true));

// 	scanner.scanln(
// 		(s) => {
// 			m.close();
// 			tab.disable();
// 			shiftTab.disable();
// 			if (s === '' && originalWindow) {
// 				// No window selected, restore original.
// 				originalWindow.focus();

// 				// Window management on macOS with multiple monitors is pretty
// 				// bad, the right window might not be focused when an app is not
// 				// focused and has multiple windows on multiple monitors.
// 				setTimeout(() => originalWindow.focus(), 200);
// 			}
// 		},
// 		(s) => {
// 			tab.enable();
// 			shiftTab.enable();

// 			prevReverse = true; // Reset.

// 			matches = winCache.filter((w) => appName(w) || title(w));
// 			m.text = msg + s + (s ? results(matches.length) : '');

// 			if (s && matches.length) {
// 				matches[0].focus();
// 				m.icon = matches[0].app().icon();
// 			} else {
// 				if (originalWindow) {
// 					originalWindow.focus();
// 				}
// 				m.icon = undefined;
// 			}

// 			showCenterOn(m, mainScreen);

// 			function appName(w: Window) {
// 				return w.app().name().toLowerCase().match(s.toLowerCase());
// 			}

// 			function title(w: Window) {
// 				return w.title().toLowerCase().match(s.toLowerCase());
// 			}
// 		},
// 	);

// 	function results(n: number) {
// 		return `\n${n} results`;
// 	}
// });

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

// lgtv.enable();

const phoenixApp = App.get('Phoenix') || App.get('Phoenix (Debug)');
titleModal('Phoenix (re)loaded!', 2, phoenixApp && phoenixApp.icon());
