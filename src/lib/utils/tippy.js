import tippy, { followCursor } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import '$lib/styles/tippy-everviz.css';

/** Svelte action: attach an edge-aware tooltip. */
export function tippyTooltip(node, params) {
	let instance = null;

	function init(next) {
		if (!next?.getContent) return;
		const { getContent, options = {}, accentColor = null } = next;
		instance = tippy(node, {
			// Use built-in bordered theme for proper notch, then customize via our CSS.
			theme: 'light-border everviz',
			animation: 'shift-away-subtle',
			placement: 'top',
			delay: [80, 0],
			offset: [0, 10],
			maxWidth: 320,
			appendTo: () => document.body,
			plugins: [followCursor],
			// Popper modifiers (edge-aware)
			popperOptions: {
				modifiers: [
					{ name: 'flip', options: { padding: 8 } },
					{ name: 'preventOverflow', options: { padding: 8 } }
				]
			},
			onShow(i) {
				i.setContent(getContent());
				if (accentColor) {
					i.popper.style.setProperty('--tooltip-accent', accentColor);
				} else {
					i.popper.style.removeProperty('--tooltip-accent');
				}
				options.onShow?.(i);
			},
			...options
		});
	}

	init(params);

	return {
		update(next) {
			params = next;
			if (!instance) {
				init(next);
				return;
			}
			if (!next?.getContent) return;
			// Update props; content + accent are refreshed on show.
			instance.setProps(next.options ?? {});
		},
		destroy() {
			instance?.destroy();
			instance = null;
		}
	};
}

