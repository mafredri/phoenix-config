import {getHandler} from './key';

const normalKeys = `§1234567890+qwertyuiopåasdfghjklöä'<zxcvbnm,.-`;
const shiftKeys = `°!"#€%&/()=?QWERTYUIOPÅASDFGHJKLÖÄ*>ZXCVBNM;:_`;
const altKeys = ` ©@£$∞§|[]≈±•Ωé®†µüıœπ˙ß∂ƒ¸˛√ªﬁøæ™  ≈ç‹›‘’‚ –`;
const altShiftKeys = `•      \\{}`;
const specialKeys = ['delete', 'escape', 'return', 'space'];

type ScanCallback = (s: string) => void;

/**
 * Scanner scans input from the user.
 */
export class Scanner {
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
			if (!s) {
				return; // an update requires a character
			}
			this.disable();
			done(s);
		};
	}

	/**
	 * scanln scans an entire line (return ends scan).
	 */
	public scanln(done: ScanCallback, update: ScanCallback = (() => undefined)) {
		this.enable();
		this.doneCallback = done;
		this.updateCallback = update;
	}

	private addKeyHandler(h: Key | undefined) {
		if (h) {
			this.keyHandlers.push(h);
		}
	}

	private enable() {
		this.scanned = ''; // reset input
		this.keyHandlers.length = 0; // remove stale keyhandlers

		if (!this.keyHandlers.length) {
			for (let i = 0; i < normalKeys.length; i++) {
				const k = normalKeys[i];
				this.addKeyHandler(new Key(k, [], () => this.handleKeyPress(k)));
				this.addKeyHandler(new Key(k, ['shift'], () => this.handleKeyPress(shiftKeys[i])));
				this.addKeyHandler(new Key(k, ['alt'], () => this.handleKeyPress(altKeys[i])));

				const ask = altShiftKeys[i] || ' ';
				this.addKeyHandler(new Key(k, ['alt', 'shift'], () => this.handleKeyPress(ask)));
			}
			for (const sk of specialKeys) {
				this.addKeyHandler(new Key(sk, [], () => this.handleKeyPress(sk)));
				this.addKeyHandler(new Key(sk, ['shift'], (h) => this.handleKeyPress(sk, h)));
			}
		}

		this.keyHandlers.forEach((h) => h.enable()); // Make sure all handlers are enabled.
	}

	private disable() {
		for (const h of this.keyHandlers) {
			h.disable();
			const last = getHandler(h.key, h.modifiers);
			if (last) {
				last.enable();
			}
		}
	}

	private handleKeyPress(key: Phoenix.KeyIdentifier, handler?: Key) {
		switch (key) {
			case 'delete':
				this.scanned = this.scanned.slice(0, -1);
				return this.updateCallback(this.scanned);
			case 'escape':
				this.disable();
				return this.doneCallback('');
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
