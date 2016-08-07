export { Scanner };

import { getLastHandler } from './key';

const normalKeys = `§1234567890+qwertyuiopåasdfghjklöä'<zxcvbnm,.-`;
const shiftKeys = `°!"#€%&/()=?QWERTYUIOPÅASDFGHJKLÖÄ*>ZXCVBNM;:_`;
const altKeys = ` ©@£$∞§|[]≈±•Ωé®†µüıœπ˙ß∂ƒ¸˛√ªﬁøæ™  ≈ç‹›‘’‚ –`;
const altShiftKeys = `•      \\{}`;
const specialKeys = ['delete', 'escape', 'return', 'space'];

type ScanCallback = (s: string) => void;

/**
 * Scanner scans input from the user.
 */
class Scanner {
	private scanned: string;
	private keyHandlers: Key[];
	private doneCallback: ScanCallback;
	private updateCallback: ScanCallback;

	constructor() {
		this.keyHandlers = [];
	}

	/**
	 * scan scans a single character.
	 */
	public scan(done: ScanCallback) {
		this.enable();
		this.doneCallback = done;
		this.updateCallback = (s) => {
			if (!s) return; // an update requires a character
			this.disable();
			done(s);
		};
	}

	/**
	 * scanln scans an entire line (return ends scan).
	 */
	public scanln(done: ScanCallback, update: ScanCallback = (() => {})) {
		this.enable();
		this.doneCallback = done;
		this.updateCallback = update;
	}

	private enable() {
		this.scanned = ''; // reset input
		this.keyHandlers.length = 0; // remove stale keyhandlers

		if (!this.keyHandlers.length) {
			for (let i = 0; i < normalKeys.length; i++) {
				let k = normalKeys[i];
				this.keyHandlers.push(new Key(k, [], () => this.handleKeyPress(k)));
				this.keyHandlers.push(new Key(k, ['shift'], () => this.handleKeyPress(shiftKeys[i])));
				this.keyHandlers.push(new Key(k, ['alt'], () => this.handleKeyPress(altKeys[i])));

				let ask = altShiftKeys[i] || ' ';
				this.keyHandlers.push(new Key(k, ['alt', 'shift'], () => this.handleKeyPress(ask)));
			}
			for (let sk of specialKeys) {
				this.keyHandlers.push(new Key(sk, [], () => this.handleKeyPress(sk)));
				this.keyHandlers.push(new Key(sk, ['shift'], (h) => this.handleKeyPress(sk, h)));
			}
		}

		this.keyHandlers.forEach(h => h.enable()); // make sure all handlers are enabled
	}

	private disable() {
		this.keyHandlers.forEach(h => {
			h.disable();
			const last = getLastHandler(h.key, h.modifiers);
			if (last) {
				last.enable();
			}
		});
	}

	private handleKeyPress(key: Phoenix.Key, handler?: Key) {
		switch (key) {
			case 'delete':
				this.scanned = this.scanned.slice(0, -1);
				return this.updateCallback(this.scanned);
			case 'escape':
				this.disable();
				return this.doneCallback(undefined); // undefined indicates aborted.
			case 'return':
				if (handler && handler.modifiers.includes('shift')) {
					this.scanned += '\n';
					return this.updateCallback(this.scanned);
				}
				this.disable();
				return this.doneCallback(this.scanned);
			case 'space':
				this.scanned += ' ';
				return this.updateCallback(this.scanned);
			default:
				this.scanned += key;
				return this.updateCallback(this.scanned);
		}
	}
}
