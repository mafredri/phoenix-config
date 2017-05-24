import { hyper, hyperShift } from './config';
import log from './logger';

const handlers: Map<string, Key> = new Map();
const hyperHandlers: Map<string, Key> = new Map();

// Custom hyper key implementation for macOS Sierra.
// Caps Lock mapped to f19, should work as hyper.
let hyperTimeout: number = 0;
onKey('f19', [], enableHyperBindings);
onKey('f19', ['shift'], enableHyperBindings);

function enableHyperBindings() {
	if (!hyperTimeout) {
		enableHyperKeys();
		hyperTimeout = setTimeout(disableHyperBindings, 510);
		return;
	}
	clearTimeout(hyperTimeout);
	hyperTimeout = setTimeout(disableHyperBindings, 110);
}

function disableHyperBindings() {
	if (hyperTimeout) {
		clearTimeout(hyperTimeout);
		hyperTimeout = 0;
	}
	disableHyperKeys();
}

function onKey(
	keys: Phoenix.KeyIdentifier | Phoenix.KeyIdentifier[],
	mod: Phoenix.ModifierKey[],
	cb: Phoenix.KeyCallback,
) {
	if (Array.isArray(keys)) {
		const unbinds: Array<() => void> = [];
		for (const key of keys) {
			unbinds.push(onKeySingle(key, mod, cb));
		}
		return () => unbinds.forEach((u) => u());
	}
	return onKeySingle(keys, mod, cb);
}

function onKeySingle(key: Phoenix.KeyIdentifier, mod: Phoenix.ModifierKey[], cb: Phoenix.KeyCallback) {
	let isHyper = false;
	if (mod === hyper) {
		mod = [];
		isHyper = true;
	} else if (mod === hyperShift) {
		mod = ['shift'];
		isHyper = true;
	}

	const handler = new Key(key, mod, cb);
	if (!handler) {
		log('error: could not create handler for', {key, mod});
		return () => {
			log('error: calling unbind on non-existent handler for', {key, mod});
		};
	}

	const id = createID(key, mod);
	handlers.set(id, handler);

	if (isHyper) {
		handler.disable(); // Add hyper handlers as disabled.
		hyperHandlers.set(id, handler);
	}

	return () => unbind(id);
}

function unbind(id: string) {
	const handler = handlers.get(id);
	if (handler) {
		handler.disable();
		handlers.delete(id);
		hyperHandlers.delete(id);
	}
}

function createID(key: string, mod: string[]) {
	return key + mod.sort().join();
}

function getHandler(key: string, mod: string[]) {
	const id = createID(key, mod);
	return handlers.get(id);
}

function enableHyperKeys() {
	hyperHandlers.forEach((h) => h.enable());
}

function disableHyperKeys() {
	hyperHandlers.forEach((h) => h.disable());
}

export { onKey, getHandler, enableHyperKeys, disableHyperKeys };
