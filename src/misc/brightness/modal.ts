import {showCenterOn} from '../../modal';

let modal: Modal | null = null;
let closeModal = 0;

export function showBrightness(value: number) {
	clearTimeout(closeModal);
	if (!modal) {
		modal = new Modal();
	}

	modal.text = `Brightness: ${value}`;
	showCenterOn(modal, Screen.main());

	closeModal = setTimeout(close, 1000);
}

function close() {
	clearTimeout(closeModal);
	if (modal) {
		modal.close();
	}
	modal = null;
	closeModal = 0;
}
