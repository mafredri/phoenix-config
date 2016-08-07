/**
 * This module starts a timer to notify you when your coffee is done.
 */
import { applyMargin, originOnScreen, Orientation } from '../modal';

export default start;

const MODAL_MARGIN = 3;
const DONE_MSG = `
Your coffee is done,
go get it!
`;

interface Config {
	screen: Screen;
	timeout: number;
}

interface CoffeTimer extends Config {
	modal: Modal;
}

export interface TimerStopper {
	stop(): void;
}

function start({ screen, timeout }: Config): TimerStopper {
	let timer = {
		screen, timeout,
		modal: new Modal(),
	};
	let update = updater(timer);

	let updateInterval = setInterval(update, 1000 * 60);
	let alertTimeout = setTimeout(alerter(timer, updateInterval), 1000 * 60 * timer.timeout);
	update();

	return {
		stop() {
			clearTimeout(updateInterval);
			clearTimeout(alertTimeout);
			timer.modal.close();
			timer.modal = null;
		},
	};
}

function updater(timer: CoffeTimer) {
	return () => {
		timer.timeout--;
		let min = timer.timeout ? '~' + String(timer.timeout) : '<1';
		timer.modal.text = `Coffee in ${min} min`;
		timer.modal.origin = applyMargin(originOnScreen(timer.modal, timer.screen, Orientation.SouthEast), MODAL_MARGIN, MODAL_MARGIN);
		timer.modal.show();
	};
}

function alerter(timer: CoffeTimer, updateInterval: number) {
	return () => {
		clearTimeout(updateInterval);
		timer.modal.close();
		timer.modal = new Modal();
		timer.modal.text = DONE_MSG.trim();
		timer.modal.showCenterOn(timer.screen);
	};
}
