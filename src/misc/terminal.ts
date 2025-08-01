// terminal exposes methods for toggling the users terminal application in a
// quake style manner. It attempts to optimize performance by caching
// information about the terminal application through Phoenix event handlers.
export {toggle, cycleWindows};

// const TERMINAL_NAME = 'Alacritty';
// const TERMINAL_NAME = 'iTerm2';
const TERMINAL_NAME = 'Ghostty';
const TERMINAL_APP = TERMINAL_NAME.replace(/[0-9]+$/, '');

function isTerminal(app: App) {
	const name = app.name();
	return name === TERMINAL_NAME || name === TERMINAL_APP;
}

function toggle() {
	const win = Window.focused();
	const app = win ? win.app() : undefined;
	if (!app || !isTerminal(app)) {
		return launchOrFocus();
	}

	// Only hide terminal if it's active and has windows.
	if (app.windows().length) {
		return app.hide();
	}

	launchOrFocus();
}

function cycleWindows() {
	const win = Window.focused();
	const app = win ? win.app() : undefined;
	if (!app || !isTerminal(app)) {
		return launchOrFocus();
	}

	const windows = app.windows();
	if (!windows.length) {
		return launchOrFocus();
	}

	windows[windows.length - 1].focus();
}

function launchOrFocus() {
	App.launch(TERMINAL_APP, {focus: true});
}
