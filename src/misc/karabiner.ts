export enum Profile {
	Internal = 'Internal Keyboard',
	Mistel = 'Mistel Barocco',
}

const bin =
	'/Library/Application Support/org.pqrs/Karabiner-Elements/bin/karabiner_cli';

export function selectProfile(p: Profile): void {
	Task.run(bin, ['--select-profile', p]);
}
