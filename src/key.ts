import log from './logger';

const handlers: Map<string, Key> = new Map();

function onKey(
	keys: Phoenix.KeyIdentifier | Phoenix.KeyIdentifier[],
	mod: Phoenix.ModifierKey[],
	cb: (handler: Key, repeated: boolean) => Promise<unknown> | unknown,
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
	cb: (handler: Key, repeated: boolean) => Promise<unknown> | unknown,
) {
	const handler = new Key(key, mod, (handler: Key, repeated: boolean) => {
		const notify = (e: unknown) => {
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

const modAlias: Record<Phoenix.ModifierKey, Phoenix.ModifierKey> = {
	command: 'command',
	cmd: 'command',
	option: 'option',
	alt: 'option',
	control: 'control',
	ctrl: 'control',
	shift: 'shift',
};

function modifiersMatch(
	mods: Phoenix.ModifierKey[],
	match: Phoenix.ModifierKey[],
): boolean {
	return (
		mods.every((m) => match.some((e) => modAlias[m] === modAlias[e])) &&
		match.every((e) => mods.some((m) => modAlias[m] === modAlias[e]))
	);
}

interface TempKey {
	enable(): void;
	disable(): void;
}

// tempKey creates a temporary key binding that starts disabled and is
// only constructed on first enable. On enable, any existing handler for
// the same key combo is saved and restored on disable.
function tempKey(
	key: Phoenix.KeyIdentifier,
	mod: Phoenix.ModifierKey[],
	cb: (handler: Key, repeated: boolean) => Promise<unknown> | unknown,
): TempKey {
	let registered = false;
	let prev: Key | undefined;

	return {
		enable() {
			prev = getHandler(key, [...mod]);
			if (!registered) {
				onKeySingle(key, mod, cb);
				registered = true;
			} else {
				getHandler(key, mod)?.enable();
			}
		},
		disable() {
			getHandler(key, mod)?.disable();
			if (prev) {
				prev.enable();
				prev = undefined;
			}
		},
	};
}

export {onKey, tempKey, getHandler, modifiersMatch};
export type {TempKey};
