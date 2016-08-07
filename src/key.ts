import log from './logger';

const handlers: Map<number, Key> = new Map();
const handlerIDs: Map<string, number> = new Map();

Key.on = (key, mod, cb) => {
	const handler = new Key(key, mod, cb);
	if (!handler) {
		return;
	}

	const id = createID(key, mod);
	handlers.set(handler.hash(), handler);
	handlerIDs.set(id, handler.hash());

	return handler.hash();
};

Key.off = (identifier) => {
	const handler = handlers.get(identifier);
	if (handler) {
		handler.disable();
		handlers.delete(identifier);
	}
};

function createID(key: string, mod: string[]) {
	return key + mod.sort().join();
}

function getLastHandler(key: string, mod: string[]) {
	const id = createID(key, mod);
	return handlers.get(handlerIDs.get(id));
}

export { getLastHandler };
