import {Observable} from 'rxjs';

export {FromEvent, fromEvent, fromAppEvent, fromMouseEvent, fromWindowEvent};

interface FromEvent<T> {
	type: string;
	handler: Event;
	target: T;
}

function toFromEvent<T>(handler: Event, target: T): FromEvent<T> {
	return {type: handler.name, handler, target};
}

function fromEvent(target: Phoenix.Event): Observable<FromEvent<void>> {
	return new Observable((subscriber) => {
		const id = Event.on(target, (handler) => {
			subscriber.next(toFromEvent(handler, undefined));
		});

		return () => {
			Event.off(id);
		};
	});
}

function fromAppEvent(target: Phoenix.AppEvent): Observable<FromEvent<App>> {
	return new Observable((subscriber) => {
		const id = Event.on(target, (target, handler) => {
			subscriber.next(toFromEvent(handler, target));
		});

		return () => {
			Event.off(id);
		};
	});
}

function fromMouseEvent(
	target: Phoenix.MouseEvent,
): Observable<FromEvent<MousePoint>> {
	return new Observable((subscriber) => {
		const id = Event.on(target, (target, handler) => {
			subscriber.next(toFromEvent(handler, target));
		});

		return () => {
			Event.off(id);
		};
	});
}

function fromWindowEvent(
	target: Phoenix.WindowEvent,
): Observable<FromEvent<Window>> {
	return new Observable((subscriber) => {
		const id = Event.on(target, (target, handler) => {
			subscriber.next(toFromEvent(handler, target));
		});

		return () => {
			Event.off(id);
		};
	});
}
