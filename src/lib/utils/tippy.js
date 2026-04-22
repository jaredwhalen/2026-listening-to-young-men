import tippy, { followCursor } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';

/** Svelte action: attach an edge-aware tooltip. */
export function tippyTooltip(node, params) {
	let instance = null;

	function init(next) {
		if (!next?.getContent) return;
		const { getContent, options = {} } = next;
		instance = tippy(node, {
			theme: 'light-border',
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
			instance.setProps(next.options ?? {});
		},
		destroy() {
			instance?.destroy();
			instance = null;
		}
	};
}

