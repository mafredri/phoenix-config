import {hyper, hyperShift} from './config';
import log from './logger';
import osascript from './misc/osascript';

const handlers: Map<string, Key> = new Map();
const emulation = {
	keyRepeat: 33, // ms.
	keyRepeatDelay: 420, // ms.
	timeout: 0,
	esc: false,
	handlers: new Map<string, Key>(),
	hyper: new Key('f19', [], enableEmulatedHyperBindings),
	hyperShift: new Key('f19', ['shift'], enableEmulatedHyperBindings),
};

export {onKey, getHandler};

function onKey(
	keys: Phoenix.KeyIdentifier | Phoenix.KeyIdentifier[],
	mod: Phoenix.ModifierKey[],
	cb: (handler: Key, repeated: boolean) => any,
) {
	if (Array.isArray(keys)) {
		const unbinds = keys.map(key => onKeySingle(key, mod, cb));
		return () => unbinds.forEach(u => u());
	}
	return onKeySingle(keys, mod, cb);
}

function onKeySingle(
	key: Phoenix.KeyIdentifier,
	mod: Phoenix.ModifierKey[],
	cb: (handler: Key, repeated: boolean) => any,
) {
	const handler = new Key(key, mod, cb);
	const id = createID(key, mod);
	handlers.set(id, handler);

	const isHyper = hyper.map(m => mod.includes(m)).every(b => b);
	if (isHyper) {
		const nonHyperMod = mod.filter(m => !hyper.includes(m));
		const nonHyperHandler = new Key(
			key,
			nonHyperMod,
			(h: Key, repeat: boolean) => {
				emulation.esc = false; // Disable esc.
				cb(h, repeat);
			},
		);
		nonHyperHandler.disable(); // Add as disabled (until emulated hyper key is pressed).
		emulation.handlers.set(id, nonHyperHandler);
	}

	return () => {
		unbind(handlers, id);
		if (isHyper) {
			unbind(emulation.handlers, id);
		}
	};
}

function unbind(h: Map<string, Key>, id: string) {
	const handler = h.get(id);
	if (handler) {
		handler.disable();
		h.delete(id);
	}
}

function createID(key: string, mod: string[]) {
	return key + mod.sort().join();
}

function getHandler(key: string, mod: string[]) {
	const id = createID(key, mod);
	return handlers.get(id);
}

function enableEmulatedHyperBindings(handler: Key, repeated: boolean) {
	clearTimeout(emulation.timeout);

	if (repeated) {
		emulation.timeout = setTimeout(
			disableEmulatedHyperBindings,
			emulation.keyRepeat + 10, // Add safety margin.
		);
		return;
	}

	if (emulation.esc) {
		osascript(`
			tell application "System Events"
				key code 53 -- Escape
			end
		`);
	}

	enableEmulatedHyperKeys();
	emulation.esc = true;
	emulation.timeout = setTimeout(
		() => {
			disableEmulatedHyperBindings();

			if (emulation.esc) {
				osascript(`
					tell application "System Events"
						key code 53 -- Escape
					end
				`);
			}
			emulation.esc = false;
		},
		emulation.keyRepeatDelay + 10, // Add safety margin.
	);
}

function disableEmulatedHyperBindings() {
	if (emulation.timeout) {
		clearTimeout(emulation.timeout);
		emulation.timeout = 0;
	}
	disableEmulatedHyperKeys();
}

function enableEmulatedHyperKeys(): void {
	emulation.handlers.forEach(h => h.enable());
}

function disableEmulatedHyperKeys(): void {
	emulation.handlers.forEach(h => h.disable());
}
