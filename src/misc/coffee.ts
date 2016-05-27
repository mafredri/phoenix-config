/**
 * This module starts a timer to notify you when your coffee is done.
 */
import { applyMargin, originOnScreen, Orientation } from '../modal';

export default coffeTimer;

const MODAL_MARGIN = 3;
const DONE_MSG = `
Your coffee is done,
go get it!
`;

function coffeTimer(after = 8) {
	const initialAfter = after;
	let modal: Modal;
	let screen: Screen;
	let timeout: EventHandler;
	let interval: EventHandler;

	return { isRunning, start, stop, set };

	function isRunning(): boolean { return Boolean(modal); }

	function set(timer: number) { after = timer; }

	function start(s: Screen) {
		if (isRunning()) return;
		if (s) screen = s;

		modal = new Modal();
		timeout = setTimeout(alert, 1000 * 60 * after);
		interval = setInterval(update, 1000 * 60);
		update();
	}

	function stop() {
		clearTimeout(timeout);
		clearTimeout(interval);
		modal.close();
		modal = null;
		after = initialAfter;
	}

	function update() {
		after--;
		let min = after ? '~' + String(after) : '<1';
		modal.message = `Coffee in ${min} min`;
		modal.origin = applyMargin(originOnScreen(modal, screen, Orientation.SouthEast), MODAL_MARGIN, MODAL_MARGIN);
		modal.show();
	}

	function alert() {
		clearInterval(interval);
		modal.close();
		modal = new Modal();
		modal.message = DONE_MSG.trim();
		modal.showCenterOn(screen);
	}
}
