export enum Profile {
	Internal,
	Mistel,
}

const bin =
	'/Library/Application Support/org.pqrs/Karabiner-Elements/bin/karabiner_cli';

export function selectProfile(p: Profile): void {
	Task.run(bin, ['--select-profile', profileString(p)]);
}

function profileString(p: Profile): string {
	switch (p) {
		case Profile.Internal:
			return 'Internal Keyboard';
		case Profile.Mistel:
			return 'Mistel Barocco';
		default:
			throw new Error('unknown profile');
	}
}
