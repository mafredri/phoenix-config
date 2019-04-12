import task from '../task';
import osascript from './osascript';

// Binary from https://github.com/mafredri/macos-darkmode
const darkmodeBin = '/Users/maf/Golang/bin/darkmode';

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
	const {output} = await task(darkmodeBin);
	return output.trim() === 'on';
}

async function setDarkMode(enabled: boolean) {
	const {output} = await task(darkmodeBin, enabled ? 'on' : 'off');
	return output;
}

function setAlfredTheme(theme: AlfredTheme) {
	return osascript(`tell application "Alfred 3" to set theme "${theme}"`);
}
