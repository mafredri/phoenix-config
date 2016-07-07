// terminal exposes methods for toggling the users terminal application in a
// quake style manner. It attempts to optimize performance by caching
// information about the terminal application through Phoenix event handlers.
export { toggle, cycleWindows };

const TERMINAL_NAME = 'iTerm2';
const TERMINAL_APP = TERMINAL_NAME.replace(/[0-9]+$/, '');

// Initialize with current app status.
let term = App.get(TERMINAL_NAME);
let termIsActive = isTerminal(Window.focusedWindow().app());

// Keep terminal app cached through event handlers to
// optimize performance.
Event.on('appDidLaunch', (app: App) => {
	if (isTerminal(app)) {
		term = app;
	}
});
Event.on('appDidTerminate', (app: App) => {
	if (isTerminal(app)) {
		term = null;
	}
});

// Cache if terminal is active so we don't need to fetch
// the active window. This is beneficial in the event that
// the currently active window isn't responding.
Event.on('appDidActivate', (app: App) => {
	termIsActive = isTerminal(app);
});

function isTerminal(app: App) {
	let name = app.name();
	return name === TERMINAL_NAME || name === TERMINAL_APP;
}

function toggle() {
	// Only hide terminal if it's active and has windows.
	if (termIsActive && term.windows().length) {
		term.hide();
	} else {
		launchOrFocus();
	}
}

function cycleWindows() {
	if (!termIsActive) {
		return launchOrFocus();
	}

	let windows = term.windows();
	if (!windows.length) {
		return launchOrFocus();
	}

	windows[windows.length - 1].focus();
}

function launchOrFocus() {
	// We don't need to care if the app is running or not,
	// launch+focus will take care of that for us.
	App.launch(TERMINAL_APP).focus();
}
