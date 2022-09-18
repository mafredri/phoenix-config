import {hyper, hyperShift} from './config';
import log from './logger';

const handlers: Map<string, Key> = new Map();

function onKey(
	keys: Phoenix.KeyIdentifier | Phoenix.KeyIdentifier[],
	mod: Phoenix.ModifierKey[],
	cb: (handler: Key, repeated: boolean) => Promise<any> | any,
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
	cb: (handler: Key, repeated: boolean) => Promise<any> | any,
) {
	const handler = new Key(key, mod, (handler: Key, repeated: boolean) => {
		const notify = (e: any) => {
			log.notify(`Key: ${key} + [${mod}]:`, e);
		};

		try {
			const ret = cb(handler, repeated);
			if (ret instanceof Promise) {
				return ret.catch(notify);
			}
			return ret;
		} catch (e) {
			notify(e);
		}
	});
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
