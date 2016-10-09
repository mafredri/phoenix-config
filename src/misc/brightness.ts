import log from '../logger';
import debounce from './debounce';

export default addBrightness;

const brightnessCmd: string = '/Users/mafredri/.bin/brightness';

// Conservative start value...
let brightnessValue: number = Storage.get('brightness');
let bModal: Modal;
let bModalHideHandler: number;

const debouncedApplyBrightness = debounce(applyBrightness, 500);

function applyBrightness() {
	Task.run(brightnessCmd, ['set', String(brightnessValue)], (t) => {
		log(t.output, t.error, t.status);
	});
}

function addBrightness(value: number) {
	if (brightnessValue === undefined) {
		brightnessValue = 40;
	}

	if (value < 0) {
		brightnessValue = Math.max(brightnessValue + value, 0);
	} else {
		brightnessValue = Math.min(brightnessValue + value, 100);
	}

	Storage.set('brightness', brightnessValue);

	showBrightness(brightnessValue);
	debouncedApplyBrightness();
}

function showBrightness(value: number) {
	clearTimeout(bModalHideHandler);
	if (!bModal) bModal = new Modal();

	bModal.text = `Brightness: ${value}`;
	bModal.showCenterOn(Screen.main());

	bModalHideHandler = setTimeout(closeBrightnessModal, 1000);
}

function closeBrightnessModal() {
	bModal.close();
	bModal = null;
	bModalHideHandler = null;
}
