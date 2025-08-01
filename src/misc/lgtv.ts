import task from '../task';
import log from '../logger';
import {fromEvent} from '../phoenix-rxjs';
import {
	merge,
	debounceTime,
	map,
	from,
	retry,
	catchError,
	switchMap,
	Subscription,
	filter,
	takeUntil,
	Observable,
	EMPTY,
} from 'rxjs';

/**
 * lgtv.ts - Manage LG webOS TV as display.
 *
 * This module provides a way to manage an LG webOS TV as a display. It
 * can turn the TV on and off, and switch to a specific input when
 * turning on.
 *
 * The module listens to events from Phoenix to determine when to turn
 * the TV on and off. It also listens to the TV to determine the current
 * input and to switch to the desired input when turning on.
 *
 * The module uses the `lgtv` command-line tool to communicate with the
 * TV, see: https://github.com/klattimer/LGWebOSRemote
 */
const config = {
	// Identifier of the TV (screen in Phoenix).
	identifier: 'C7800A29-BB80-40EF-A800-B2DB69B1A399',
	// Input to switch to when turning on.
	input: 'HDMI_1',
	// Name of TV in LGWebOSRemote config.
	name: 'tv',
	// Whether to switch to the desired input when turning on.
	wakeToInput: true,
	// Whether to only control the input if it's the same as the desired
	// input or the TV is off.
	controlSameInput: true,
};

export {enable, disable};

let enableSubscription: Subscription | null = null;

async function enable() {
	const screensDidChange$ = fromEvent('screensDidChange');

	const onEvents$ = merge(
		screensDidChange$.pipe(filter(() => isConnected())),
		fromEvent('deviceDidWake'),
		fromEvent('didLaunch'),
	).pipe(
		debounceTime(1500),
		filter(() => isConnected()),
		map(() => powerOn),
	);

	const offEvents$ = merge(
		screensDidChange$.pipe(filter(() => !isConnected())),
		fromEvent('deviceWillSleep'),
		fromEvent('willTerminate'),
	).pipe(
		takeUntil(onEvents$),
		debounceTime(5000),
		map(() => powerOff),
	);

	const retryOptions = {count: 20, delay: 1500};
	const allEvents$ = merge(onEvents$, offEvents$).pipe(
		switchMap((action) =>
			handleWithRetry(from(getCurrentInput()), retryOptions).pipe(
				map((input) => ({action, input})),
			),
		),
		switchMap(({action, input}) =>
			handleWithRetry(from(action(input)), retryOptions),
		),
	);

	enableSubscription = allEvents$.subscribe();
}

async function disable() {
	enableSubscription?.unsubscribe();
	enableSubscription = null;
}

function handleWithRetry<T>(
	observable: Observable<T>,
	retryOptions: {count: number; delay: number},
) {
	return observable.pipe(
		retry(retryOptions),
		catchError((e) => {
			log.notify(e);
			return EMPTY;
		}),
	);
}

function isConnected() {
	const screens = Screen.all().map((s) => s.identifier());
	const connected = screens.includes(config.identifier);
	return connected;
}

interface CurrentInput {
	appId: string;
	active: boolean;
}

async function getCurrentInput(): Promise<CurrentInput> {
	const appId = (await getForegroundAppInfo()).appId;
	const active = appId === inputToAppId(config.input);

	return {appId, active};
}

async function powerOn(input: CurrentInput) {
	if (input.active) {
		log('lgtv: powerOn: input is already active, nothing to do');
		return;
	}

	await task('vmm7100reset'); // Reset VMM7100 to fix HDMI issues.
	await Promise.all([
		lgtv('on'), // WOL
		lgtv('screenOn'), // Turn on screen.
	]);
	if (config.wakeToInput) {
		input = await getCurrentInput(); // Refresh input state.
		if (!input.active) {
			log(
				`lgtv: powerOn: input is ${input.appId}, switching to ${config.input}`,
			);
			await lgtv('setInput', config.input);
		} else {
			log(
				`lgtv: powerOn: input is currently ${input.appId}, nothing to do`,
			);
		}
	}
}

async function powerOff(input: CurrentInput) {
	if (config.controlSameInput && !input.active) {
		log('lgtv: powerOff: input is not active, nothing to do');
		return;
	}
	await lgtv('off');
}

async function getForegroundAppInfo() {
	const resp = await lgtv<{
		returnValue: boolean;
		appId: string;
		processId: string;
		windowId: string;
	}>('getForegroundAppInfo');
	return resp;
}

interface response<T> {
	type: string;
	id: string;
	payload: T;
}

interface closeResponse {
	closing?: {
		code: number;
		reason: string;
	};
}

async function lgtv<T>(...args: string[]): Promise<T> {
	args = ['--ssl', '--name', config.name, ...args];
	try {
		const cmd = await task('lgtv', ...args);
		const out = cmd.output.trim();
		if (out === '') {
			return {} as T;
		}

		const resp = out.split('\n').map((v) => JSON.parse(v));
		const close: closeResponse = resp[resp.length - 1];
		if (close.closing) {
			resp.pop();
			if (close.closing.code !== 1000) {
				// TODO(mafredri): Error?
				log('unexpected close', close);
			}
		}
		if (resp.length > 1) {
			log('unexpected response', resp);
		}

		const first: response<T> = resp[0];
		log(first);

		return first.payload;
	} catch (e) {
		log.notify(e);
		throw e;
	}
}

function inputToAppId(input: string): string {
	return `com.webos.app.${input.toLowerCase().replace('_', '')}`;
}
