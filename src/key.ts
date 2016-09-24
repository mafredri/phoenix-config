import log from './logger';
import { hyper, hyperShift } from './config';

const handlers: Map<string, Key> = new Map();
const hyperHandlers: Map<string, Key> = new Map();

function onKey(key: Phoenix.KeyIdentifier, mod: Phoenix.ModifierKey[], cb: Phoenix.KeyCallback) {
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
		return;
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
	hyperHandlers.forEach(h => h.enable());
}

function disableHyperKeys() {
	hyperHandlers.forEach(h => h.disable());
}

export { onKey, getHandler, enableHyperKeys, disableHyperKeys };
