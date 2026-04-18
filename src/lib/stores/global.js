import { writable, derived } from 'svelte/store';

export const windowWidth = writable(0);
export const windowHeight = writable(0);

export const isMobile = derived(windowWidth, ($windowWidth) =>
	$windowWidth <= 560 ? true : false
);

export const isLarge = derived(windowWidth, ($windowWidth) => ($windowWidth > 1200 ? true : false));


export const data = writable(undefined);

export const featured = writable([]);
