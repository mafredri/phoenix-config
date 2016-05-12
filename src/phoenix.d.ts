interface Window {
	to(position: (frame: Rectangle, window: Rectangle, margin?: number) => Point): void;
	grid(x: number, y: number, reverse?: boolean): void;
	reverseGrid(x: number, y: number): void;
	resize(multiplier: { x?: number, y?: number }): void;
	increaseWidth(): void;
	decreaseWidth(): void;
	increaseHeight(): void;
	decreaseHeight(): void;
	clearPosition(): void;

	// FIXME: Don't use so many prototype functions for this...
	toggleMaximized(): void;
	isMaximized(): void;
	unmaximizedFrame(): Rectangle;
	setUnmaximizedFrame(frame: Rectangle): void;
}

interface ScreenObject {
	/**
	 * Returns the screen at the provided point.
	 */
	at(point: Point): Screen;
}

interface intervalFunction {
	(callback: Function, interval: number): EventHandler;
}
declare var setTimeout: intervalFunction;
declare var setInterval: intervalFunction;

interface Modal {
	/**
	 * Show modal in title position on screen.
	 */
	showTitleOn(screen: Screen): void
	/**
	 * Show modal in center position on screen.
	 */
	showCenterOn(screen: Screen): void
}
