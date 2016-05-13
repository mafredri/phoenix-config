export { titleModal };

function titleModal(message: string, duration: number = 1) {
	let m = new Modal();
	m.message = message;
	m.duration = duration;
	m.showTitleOn(Screen.mainScreen());
}

Modal.prototype.showTitleOn = function(screen: Screen) {
	showAt(this, screen, 2, 1 + (1 / 3));
};

Modal.prototype.showCenterOn = function(screen: Screen) {
	showAt(this, screen, 2, 2);
};

function showAt(modal: Modal, screen: Screen, widthDiv: number, heightDiv: number) {
	let { height, width } = modal.frame();
	let sf = screen.visibleFrameInRectangle();
	modal.origin = {
		x: sf.x + ((sf.width - width) / widthDiv),
		y: sf.y + ((sf.height - height) / heightDiv),
	};
	modal.show();
}
