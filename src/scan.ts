import log from './logger';

export { Scanner };

export const keyHandlers: KeyHandler[] = [];

const interceptKeys = `1234567890+qwertyuiopåasdfghjklöä'<zxcvbnm,.-`;
const shiftKeys = `!"#€%&/()=?QWERTYUIOPÅASDFGHJKLÖÄ*>ZXCVBNM;:_`;
const altKeys = `©@£$∞§|[]≈±•Ωé®†µüıœπ˙ß∂ƒ¸˛√ªﬁøæ™  ≈ç‹›‘’‚ –`;
const altShiftKeys = `      \\{}`;
const specialKeys = ['escape', 'return', 'space', 'delete'];

type ScanCallback = (s: string) => void;

class Scanner {
	private scanned: string;
	private keyHandlers: KeyHandler[];
	private doneCallback: ScanCallback;
	private updateCallback: ScanCallback;

	constructor() {
		this.keyHandlers = [];
	}

	public scanln(done: ScanCallback, update: ScanCallback = (() => {})) {
		this.enable();
		this.doneCallback = done;
		this.updateCallback = update;
	}

	private enable() {
		this.scanned = '';
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
			case 'escape':
				this.doneCallback(undefined);
				return this.disable();
			case 'return':
				this.doneCallback(this.scanned);
				return this.disable();
			case 'delete':
				this.scanned = this.scanned.slice(0, -1);
				return this.updateCallback(this.scanned);
			case 'space':
				this.scanned += ' ';
				return this.updateCallback(this.scanned);
			default:
				this.scanned += key;
				return this.updateCallback(this.scanned);;
		}
	}
}
