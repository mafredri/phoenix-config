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
	at(point: Point): Screen | undefined;
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
