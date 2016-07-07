interface Window {
	/**
	 * Clear unmaximized position.
	 */
	clearUnmaximized(): void;
	toggleMaximized(): void;
}

interface ScreenObject {
	/**
	 * Returns the screen at the provided point.
	 */
	at(point: Point): Screen;
}

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

interface intervalFunction {
	(callback: Function, interval: number): number;
}
declare var setTimeout: intervalFunction;
declare var setInterval: intervalFunction;
declare var clearTimeout: (handler: number) => void;
declare var clearInterval: (handler: number) => void;
