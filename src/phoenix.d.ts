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

// Define interval function for global scope, defined in js/timeout.js
interface intervalFunction {
	(callback: Function, interval: number): EventHandler;
}
declare var setTimeout: intervalFunction;
declare var setInterval: intervalFunction;
declare var clearTimeout: (handler: EventHandler) => void;
declare var clearInterval: (handler: EventHandler) => void;
