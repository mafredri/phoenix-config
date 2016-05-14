export default addBrightness;

const brightnessCmd: string = '/Users/mafredri/.bin/brightness';
// Conservative start value...
let brightnessValue: number = 40;
let bModal: Modal = new Modal();

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
	bModal.close();
	bModal = new Modal();
	bModal.duration = 1;
	bModal.message = `Brightness: ${value}`;
	bModal.showCenterOn(Screen.mainScreen());
}
