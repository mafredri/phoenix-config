export { Scanner };

const interceptKeys = `1234567890+qwertyuiopåasdfghjklöä'<zxcvbnm,.-`;
const shiftKeys = `!"#€%&/()=?QWERTYUIOPÅASDFGHJKLÖÄ*>ZXCVBNM;:_`;
const altKeys = `©@£$∞§|[]≈±•Ωé®†µüıœπ˙ß∂ƒ¸˛√ªﬁøæ™  ≈ç‹›‘’‚ –`;
const altShiftKeys = `      \\{}`;
const specialKeys = ['delete', 'escape', 'return', 'space'];

type ScanCallback = (s: string) => void;

/**
 * Scanner scans input from the user.
 */
class Scanner {
	private scanned: string;
	private keyHandlers: KeyHandler[];
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
			done(s);
			this.disable();
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
		if (this.keyHandlers.length) {
			return this.keyHandlers.forEach(h => h.enable());
		}

		for (let i = 0; i < interceptKeys.length; i++) {
			let k = interceptKeys[i];
			this.keyHandlers.push(Phoenix.bind(k, [], () => this.handleKeyPress(k)));
			this.keyHandlers.push(Phoenix.bind(k, ['shift'], () => this.handleKeyPress(shiftKeys[i])));
			this.keyHandlers.push(Phoenix.bind(k, ['alt'], () => this.handleKeyPress(altKeys[i])));

			let ask = altShiftKeys[i] || ' ';
			this.keyHandlers.push(Phoenix.bind(k, ['alt', 'shift'], () => this.handleKeyPress(ask)));
		}
		for (let sk of specialKeys) {
			this.keyHandlers.push(Phoenix.bind(sk, [], () => this.handleKeyPress(sk)));
			this.keyHandlers.push(Phoenix.bind(sk, ['shift'], () => this.handleKeyPress(sk)));
		}
	}

	private disable() {
		this.keyHandlers.forEach(h => h.disable());
	}

	private handleKeyPress(key: Phoenix.Key) {
		switch (key) {
			case 'delete':
				this.scanned = this.scanned.slice(0, -1);
				return this.updateCallback(this.scanned);
			case 'escape':
				this.doneCallback(undefined); // undefined indicates aborted.
				return this.disable();
			case 'return':
				this.doneCallback(this.scanned);
				return this.disable();
			case 'space':
				this.scanned += ' ';
				return this.updateCallback(this.scanned);
			default:
				this.scanned += key;
				return this.updateCallback(this.scanned);;
		}
	}
}
