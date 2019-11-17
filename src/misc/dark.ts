import task from '../task';
import osascript from './osascript';

enum AlfredTheme {
	Light = 'Alfred macOS',
	Dark = 'Alfred macOS Dark',
}

export async function toggle() {
	await isDarkMode().then(enabled => {
		if (enabled) {
			return disable();
		}
		return enable();
	});
}

export async function enable() {
	await setDarkMode(true);
	await setAlfredTheme(AlfredTheme.Dark);
}

export async function disable() {
	await setDarkMode(false);
	await setAlfredTheme(AlfredTheme.Light);
}

export async function isDarkMode(): Promise<boolean> {
	const output = await osascript(`
		tell application "System Events"
			tell appearance preferences
				get dark mode as boolean
			end tell
		end tell
	`);
	return output.trim().toLowerCase() === 'true';
}

function setDarkMode(enabled: boolean) {
	return osascript(`
		tell application "System Events"
			tell appearance preferences
				set dark mode to ${enabled}
			end tell
		end tell
	`);
}

function setAlfredTheme(theme: AlfredTheme) {
	return osascript(`tell application "Alfred 4" to set theme "${theme}"`);
}
