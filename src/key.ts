import log from './logger';

const handlers: Map<string, Key> = new Map();

function onKey(key: Phoenix.KeyIdentifier, mod: Phoenix.ModifierKey[], cb: Phoenix.KeyCallback) {
	const handler = new Key(key, mod, cb);
	if (!handler) {
		return;
	}

	const id = createID(key, mod);
	handlers.set(id, handler);

	return () => unbind(id);
}

function unbind(id: string) {
	const handler = handlers.get(id);
	if (handler) {
		handler.disable();
		handlers.delete(id);
	}
}

function createID(key: string, mod: string[]) {
	return key + mod.sort().join();
}

function getHandler(key: string, mod: string[]) {
	const id = createID(key, mod);
	return handlers.get(id);
}

export { onKey, getHandler };
