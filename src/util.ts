import log from './logger';

export { enforceKeyhandlersEnabled };

function enforceKeyhandlersEnabled(keyHandler: KeyHandler[]) {
	let ok = keyHandler.every(h => (!h.isEnabled() ? h.enable() : h.isEnabled()));
	if (!ok) {
		log('All keys not enabled, retrying in 100 ms...');
		setTimeout(() => enforceKeyhandlersEnabled(keyHandler), 100);
	}
}
