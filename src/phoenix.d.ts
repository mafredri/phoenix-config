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
	showTitleOn(screen: Screen): void;
	/**
	 * Show modal in center position on screen.
	 */
	showCenterOn(screen: Screen): void;
}

type IntervalFunction = (callback: () => void, interval: number) => number;

declare var setTimeout: IntervalFunction;
declare var setInterval: IntervalFunction;
declare var clearTimeout: (handler: number) => void;
declare var clearInterval: (handler: number) => void;
