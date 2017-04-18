export default function debounce(func: () => void, wait: number, immediate?: boolean) {
	let timeout: number;
	return (...args: any[]) => {
		const later = () => {
			timeout = null;
			if (!immediate) {
				func.apply(this, args);
			}
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) {
			func.apply(this, args);
		}
	};
}
