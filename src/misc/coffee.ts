/**
 * This module starts a timer to notify you when your coffee is done.
 */
import { applyMargin, Orientation, originOnScreen } from '../modal';

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
	modal?: Modal;
}

export interface TimerStopper {
	stop(): void;
}

function start({ screen, timeout }: Config): TimerStopper {
	const timer: CoffeTimer = {
		modal: new Modal(),
		screen,
		timeout,
	};
	const update = updater(timer);

	const updateInterval = setInterval(update, 1000 * 60);
	const alertTimeout = setTimeout(alerter(timer, updateInterval), 1000 * 60 * timer.timeout);
	update();

	return {
		stop() {
			clearTimeout(updateInterval);
			clearTimeout(alertTimeout);
			if (timer.modal) { timer.modal.close(); }
			timer.modal = undefined;
		},
	};
}

function updater(timer: CoffeTimer) {
	return () => {
		if (!timer.modal) {
			return;
		}
		timer.timeout--;
		const min = timer.timeout ? '~' + String(timer.timeout) : '<1';
		timer.modal.text = `Coffee in ${min} min`;

		const screenOrigin = originOnScreen(timer.modal, timer.screen, Orientation.SouthEast);
		timer.modal.origin = applyMargin(screenOrigin, MODAL_MARGIN, MODAL_MARGIN);
		timer.modal.show();
	};
}

function alerter(timer: CoffeTimer, updateInterval: number) {
	return () => {
		clearTimeout(updateInterval);
		if (timer.modal) { timer.modal.close(); }
		timer.modal = new Modal();
		timer.modal.text = DONE_MSG.trim();
		timer.modal.showCenterOn(timer.screen);
	};
}
