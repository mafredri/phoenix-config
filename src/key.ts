import {hyper, hyperShift} from './config';
import log from './logger';

const handlers: Map<string, Key> = new Map();

function onKey(
	keys: Phoenix.KeyIdentifier | Phoenix.KeyIdentifier[],
	mod: Phoenix.ModifierKey[],
	cb: Phoenix.KeyCallback,
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
	cb: Phoenix.KeyCallback,
) {
	const handler = new Key(key, mod, cb);
	if (!handler) {
		const keyName = `(key=${key}, mod=[${mod.join(' ')}])`;
		log.notify(new Error(`could not create handler for ${keyName}`));
		return () => {
			log.notify(new Error(`unbind on non-existent handler ${keyName}`));
		};
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

export {onKey, getHandler};
