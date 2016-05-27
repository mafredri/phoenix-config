export default addBrightness;

const brightnessCmd: string = '/Users/mafredri/.bin/brightness';

// Conservative start value...
let brightnessValue: number = 40;
let bModal: Modal;
let bModalHideHandler: EventHandler;

function addBrightness(value: number) {
	if (value < 0) {
		brightnessValue = Math.max(brightnessValue + value, 0);
	} else {
		brightnessValue = Math.min(brightnessValue + value, 100);
	}
	showBrightness(brightnessValue);
	Command.run(brightnessCmd, ['set', String(brightnessValue)])
}

function showBrightness(value: number) {
	if (!bModal) bModal = new Modal();

	bModal.message = `Brightness: ${value}`;
	bModal.showCenterOn(Screen.mainScreen());

	if (bModalHideHandler) {
		clearTimeout(bModalHideHandler);
	}
	bModalHideHandler = setTimeout(closeBrightnessModal, 1000);
}

function closeBrightnessModal() {
	bModal.close();
	bModal = null;
	bModalHideHandler = null;
}
