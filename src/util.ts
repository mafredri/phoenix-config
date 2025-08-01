export {sleep, retry, objEq};

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

async function retry(
	operation: () => boolean,
	maxAttempts: number = 5,
	delayMs: number = 50,
): Promise<boolean> {
	for (let i = 0; i < maxAttempts; i++) {
		if (operation()) {
			return true;
		}
		if (i < maxAttempts - 1) {
			await sleep(delayMs);
		}
	}
	return false;
}

function objEq<T extends object>(a: T, b: T): boolean {
	const keys = Object.keys(a) as (keyof T)[];
	if (keys.length !== Object.keys(b).length) {
		return false;
	}
	return keys.every((k) => {
		const aVal = a[k];
		const bVal = b[k];
		if (
			typeof aVal === 'object' &&
			aVal !== null &&
			typeof bVal === 'object' &&
			bVal !== null
		) {
			return objEq(aVal, bVal);
		}
		return aVal === bVal;
	});
}
