import log from './logger';

const handlers: Map<string, Key> = new Map();

function onKey(
	keys: Phoenix.KeyIdentifier | Phoenix.KeyIdentifier[],
	mod: Phoenix.ModifierKey[],
	cb: (handler: Key, repeated: boolean) => any,
) {
	if (Array.isArray(keys)) {
		const unbinds = keys.map((key) => onKeySingle(key, mod, cb));
		return () => unbinds.forEach((u) => u());
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

export {onKey, getHandler};
