import {getHandler} from './key';

const layout = {
	fi: {
		normal: `§1234567890+qwertyuiopåasdfghjklöä'<zxcvbnm,.-`,
		shift: `°!"#€%&/()=?QWERTYUIOPÅASDFGHJKLÖÄ*>ZXCVBNM;:_`,
		alt: ` ©@£$∞§|[]≈±•Ωé®†µüıœπ˙ß∂ƒ¸˛√ªﬁøæ™  ≈ç‹›‘’‚ –`,
		altShift: `•      \\{}`,
	},
	us: {
		normal: `§1234567890-=qwertyuiop[]asdfghjkl;'\\\`zxcvbnm,./`,
		shift: `±!@#$%^&*()_+QWERTYUIOP{}ASDFGHJKL:"|~ZXCVBNM<>?`,
		alt: ` ¡™£¢∞§¶•ªº–≠œ∑´®†¥¨ˆøπ“‘åß∂ƒ©˙∆˚¬…æ«  ≈ç√∫˜µ≤≥÷`,
		altShift: `±⁄€‹›ﬁﬂ‡°·‚—±Œ„´‰ˇÁ¨ Ø∏”’  Î ˝ÓÔÒÚÆ» ¸˛Ç◊ı˜Â¯˘¿`,
	},
};

const keys = layout.us;
const specialKeys = ['delete', 'escape', 'return', 'space'];

type ScanCallback = (s: string) => void;

/**
 * Scanner scans input from the user.
 */
export class Scanner {
	private scanned = '';
	private keyHandlers: Key[];
	private doneCallback: ScanCallback | undefined;
	private updateCallback: ScanCallback | undefined;

	constructor() {
		this.keyHandlers = [];
	}

	/**
	 * scan scans a single character.
	 */
	public scan(done: ScanCallback) {
		this.doneCallback = done;
		this.updateCallback = s => {
			if (!s) {
				return; // an update requires a character
			}
			this.disable();
			done(s);
		};
		this.enable();
	}

	/**
	 * scanln scans an entire line (return ends scan).
	 */
	public scanln(done: ScanCallback, update: ScanCallback = () => undefined) {
		this.enable();
		this.doneCallback = done;
		this.updateCallback = update;
	}

	private enable() {
		this.scanned = ''; // reset input
		this.keyHandlers.length = 0; // remove stale keyhandlers

		if (!this.keyHandlers.length) {
			for (let i = 0; i < keys.normal.length; i++) {
				const k = keys.normal[i];
				const ask = keys.altShift[i] || ' ';
				this.keyHandlers.push(
					new Key(k, [], () => this.handleKeyPress(k)),
					new Key(k, ['shift'], () =>
						this.handleKeyPress(keys.shift[i]),
					),
					new Key(k, ['alt'], () => this.handleKeyPress(keys.alt[i])),
					new Key(k, ['alt', 'shift'], () =>
						this.handleKeyPress(ask),
					),
				);
			}
			for (const sk of specialKeys) {
				this.keyHandlers.push(
					new Key(sk, [], () => this.handleKeyPress(sk)),
					new Key(sk, ['shift'], h => this.handleKeyPress(sk, h)),
				);
			}
		}

		this.keyHandlers.forEach(h => h.enable()); // Make sure all handlers are enabled.
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
		if (!this.doneCallback || !this.updateCallback) {
			throw new Error('Scanner callbacks are not set up properly');
		}
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
