/**
 * Implement setTimeout / setInterval for Phoenix
 */
(function (global) {
	// Keeps references to Phoenix handlers
	var refs = new Set();

	// Add functions on the global object
	global.setTimeout = setTimeout;
	global.clearTimeout = clear;
	global.setInterval = setInterval;
	global.clearInterval = clear;

	function setTimeout(fn, interval) {
		var handler = Phoenix.after(interval / 1000, handleFn);
		refs.add(handler);
		return handler;

		function handleFn() {
			fn();
			refs.delete(handler); // Delete reference after completion
		}
	}

	function setInterval(fn, interval) {
		var handler = Phoenix.every(interval / 1000, fn);
		refs.add(handler);
		return handler;
	}

	function clear(handler) {
		handler.stop(); // Stop the timer immediately
		refs.delete(handler);
	}
})(this);
