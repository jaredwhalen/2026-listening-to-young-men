import {
	arrow,
	autoUpdate,
	computePosition,
	flip,
	getOverflowAncestors,
	offset,
	shift,
} from '@floating-ui/dom';
import '$lib/styles/everviz-floating-tooltip.css';

const EDGE_PAD = 8;
const OFFSET_MAIN = 10;
const SHOW_DELAY_MS = 80;
const HIDE_BRIDGE_MS = 100;

/**
 * Used only for `ARROW_EDGE_PX` (how far the arrow box sits past the tooltip padding edge).
 * Tune by eye for your layout; it does **not** have to match `.everviz-floating-tooltip__arrow`
 * `width`/`height` in CSS (those size the drawn triangles).
 */
const ARROW_BOX = 12;
const ARROW_HALF = ARROW_BOX / 2;
/** Straddle outer border: half box + 1px from padding edge (tweak with --arrow-fill-inset / nudge rules). */
const ARROW_EDGE_PX = -(ARROW_HALF + 1);

function resolveAppendTo(appendTo, reference) {
	if (typeof appendTo === 'function') return appendTo() ?? document.body;
	if (appendTo instanceof HTMLElement) return appendTo;
	return reference.parentElement ?? document.body;
}

/** @param {HTMLElement} arrowEl */
function applyArrowStyles(arrowEl, placement, arrowData) {
	const side = placement.split('-')[0];
	const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side];
	if (!staticSide || !arrowData) return;

	const a = arrowData;
	const edge = `${ARROW_EDGE_PX}px`;
	Object.assign(arrowEl.style, {
		left: a.x != null ? `${a.x}px` : '',
		top: a.y != null ? `${a.y}px` : '',
		right: '',
		bottom: '',
		[staticSide]: edge,
	});
}

/** Svelte action: edge-aware Everviz-style tooltip (Floating UI). */
export function evervizFloatingTooltip(node, params) {
	let floating = /** @type {HTMLElement | null} */ (null);
	let arrowEl = /** @type {HTMLElement | null} */ (null);
	let innerEl = /** @type {HTMLElement | null} */ (null);
	let stopAutoUpdate = /** @type {null | (() => void)} */ (null);
	let hideTimer = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
	let showTimer = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
	let scrollRoots = /** @type {Set<EventTarget>} */ (new Set());
	let openInput = /** @type {'pointer' | 'touch' | 'keyboard' | null} */ (null);
	let suppressClickUntil = 0;
	let followX = 0;
	let followY = 0;

	const cursorVirtualRef = {
		getBoundingClientRect() {
			return DOMRect.fromRect({ x: followX, y: followY, width: 0, height: 0 });
		},
		getClientRects() {
			const r = this.getBoundingClientRect();
			return /** @type {DOMRectList} */ (
				/** @type {unknown} */ ({
					length: 1,
					item: (/** @type {number} */ i) => (i === 0 ? r : null),
					0: r,
					[Symbol.iterator]: function* () {
						yield r;
					},
				})
			);
		},
		contextElement: node,
	};

	function syncFollowFromNodeCenter() {
		const r = node.getBoundingClientRect();
		followX = r.left + r.width / 2;
		followY = r.top + r.height / 2;
	}

	function onFollowPointerMove(e) {
		if (!floating || !currentParams?.options?.followCursor) return;
		if (e.pointerType === 'touch') return;
		followX = e.clientX;
		followY = e.clientY;
		void positionNow();
	}

	function clearShowTimer() {
		if (showTimer) {
			clearTimeout(showTimer);
			showTimer = null;
		}
	}

	function clearHideTimer() {
		if (hideTimer) {
			clearTimeout(hideTimer);
			hideTimer = null;
		}
	}

	function removeScrollDismiss() {
		for (const t of scrollRoots) {
			t.removeEventListener('scroll', onScrollDismiss, true);
		}
		scrollRoots.clear();
		window.visualViewport?.removeEventListener('resize', onScrollDismiss);
		window.visualViewport?.removeEventListener('scroll', onScrollDismiss);
	}

	function onScrollDismiss() {
		hide();
	}

	function attachScrollDismiss() {
		removeScrollDismiss();
		const roots = new Set([
			window,
			...getOverflowAncestors(node),
			...(floating ? getOverflowAncestors(floating) : []),
		]);
		for (const el of roots) {
			if (el && typeof el.addEventListener === 'function') {
				el.addEventListener('scroll', onScrollDismiss, { capture: true, passive: true });
				scrollRoots.add(el);
			}
		}
		window.visualViewport?.addEventListener('resize', onScrollDismiss, { passive: true });
		window.visualViewport?.addEventListener('scroll', onScrollDismiss, { passive: true });
	}

	function onDocPointerDown(e) {
		if (!floating) return;
		const t = /** @type {Node | null} */ (e.target);
		if (t && (node.contains(t) || floating.contains(t))) return;
		hide();
	}

	function onKeyDown(e) {
		if (e.key === 'Escape') hide();
	}

	async function positionNow() {
		if (!floating) return;
		const p = currentParams;
		const strat = p?.options?.popperOptions?.strategy ?? 'fixed';
		const placementPref = p?.options?.placement ?? 'top';
		const useFollow = Boolean(p?.options?.followCursor);
		const ref =
			useFollow && openInput !== 'keyboard' ? cursorVirtualRef : node;
		const arrowMw = arrow({
			element: /** @type {HTMLElement} */ (arrowEl),
			padding: EDGE_PAD,
		});

		const { x, y, placement, middlewareData } = await computePosition(ref, floating, {
			placement: placementPref,
			strategy: strat,
			middleware: [
				offset(OFFSET_MAIN),
				flip({ padding: EDGE_PAD, crossAxis: false }),
				shift({ padding: EDGE_PAD }),
				arrowMw,
			],
		});

		Object.assign(floating.style, {
			position: strat,
			left: `${x}px`,
			top: `${y}px`,
		});
		floating.dataset.placement = placement;
		applyArrowStyles(/** @type {HTMLElement} */ (arrowEl), placement, middlewareData.arrow);
	}

	let currentParams = /** @type {EvervizFloatingTooltipParams | null} */ (null);

	function teardownFloating() {
		document.removeEventListener('pointermove', onFollowPointerMove, true);
		removeScrollDismiss();
		document.removeEventListener('pointerdown', onDocPointerDown, true);
		document.removeEventListener('keydown', onKeyDown, true);
		if (stopAutoUpdate) {
			stopAutoUpdate();
			stopAutoUpdate = null;
		}
		if (floating) {
			floating.removeEventListener('pointerenter', onFloatingPointerEnter);
			floating.removeEventListener('pointerleave', onFloatingPointerLeave);
		}
		if (floating?.isConnected) floating.remove();
		floating = null;
		arrowEl = null;
		innerEl = null;
		node.removeAttribute('aria-describedby');
		openInput = null;
	}

	function hide() {
		clearShowTimer();
		clearHideTimer();
		teardownFloating();
	}

	function scheduleHideBridge() {
		if (openInput === 'touch') return;
		clearHideTimer();
		hideTimer = setTimeout(() => {
			hideTimer = null;
			if (!floating) return;
			if (node.matches(':hover') || floating.matches(':hover')) return;
			hide();
		}, HIDE_BRIDGE_MS);
	}

	function show(fromInput) {
		clearShowTimer();
		clearHideTimer();
		openInput = fromInput;
		if (!currentParams?.getContent) return;
		if (floating?.isConnected) {
			refreshContent();
			void positionNow();
			return;
		}

		const root = resolveAppendTo(currentParams.options?.appendTo, node);
		floating = document.createElement('div');
		floating.className = 'everviz-floating-tooltip';
		floating.setAttribute('role', 'tooltip');

		arrowEl = document.createElement('div');
		arrowEl.className = 'everviz-floating-tooltip__arrow';
		innerEl = document.createElement('div');
		innerEl.className = 'everviz-floating-tooltip__inner';

		floating.append(innerEl, arrowEl);
		root.append(floating);

		const mw = currentParams.options?.maxWidth;
		if (mw != null) {
			floating.style.setProperty('--everviz-tooltip-max-width', `${mw}px`);
		} else {
			floating.style.removeProperty('--everviz-tooltip-max-width');
		}

		const accent = currentParams.accentColor;
		if (accent) floating.style.setProperty('--tooltip-accent', accent);
		else floating.style.removeProperty('--tooltip-accent');

		refreshContent();

		const tipId = `everviz-tip-${Math.random().toString(36).slice(2, 11)}`;
		floating.id = tipId;
		node.setAttribute('aria-describedby', tipId);

		stopAutoUpdate = autoUpdate(node, floating, () => {
			void positionNow();
		});

		document.addEventListener('pointerdown', onDocPointerDown, true);
		document.addEventListener('keydown', onKeyDown, true);
		attachScrollDismiss();

		if (currentParams.options?.followCursor) {
			syncFollowFromNodeCenter();
			document.addEventListener('pointermove', onFollowPointerMove, {
				capture: true,
				passive: true,
			});
		}

		currentParams.options?.onShow?.({ floating });

		if (currentParams.options?.interactive) {
			floating.addEventListener('pointerenter', onFloatingPointerEnter);
			floating.addEventListener('pointerleave', onFloatingPointerLeave);
		}

		void positionNow();
	}

	function refreshContent() {
		if (!innerEl || !currentParams?.getContent) return;
		innerEl.replaceChildren();
		const frag = currentParams.getContent();
		if (frag instanceof Node) innerEl.append(frag);
	}

	function scheduleShow(fromInput) {
		clearShowTimer();
		showTimer = setTimeout(() => {
			showTimer = null;
			show(fromInput);
		}, SHOW_DELAY_MS);
	}

	function onRefPointerEnter(e) {
		if (e.pointerType === 'touch') return;
		scheduleShow('pointer');
	}

	function onRefPointerLeave(e) {
		if (e.pointerType === 'touch') return;
		if (!floating || !currentParams?.options?.interactive) {
			hide();
			return;
		}
		scheduleHideBridge();
	}

	function onFloatingPointerEnter() {
		clearHideTimer();
	}

	function onFloatingPointerLeave() {
		if (!currentParams?.options?.interactive) return;
		scheduleHideBridge();
	}

	function onRefFocusIn() {
		clearShowTimer();
		show('keyboard');
	}

	function onRefFocusOut() {
		queueMicrotask(() => {
			if (!floating) return;
			const ae = document.activeElement;
			if (ae instanceof Node && (node.contains(ae) || floating.contains(ae))) return;
			hide();
		});
	}

	function onRefPointerDown(e) {
		if (e.pointerType !== 'touch') return;
		e.preventDefault();
		suppressClickUntil = Date.now() + 450;
		if (floating?.isConnected) hide();
		else {
			clearShowTimer();
			show('touch');
		}
	}

	/** Fine pointer: instant open on click before hover delay finishes; click again closes. */
	function onRefClick(e) {
		if (e.pointerType === 'touch') return;
		if (Date.now() < suppressClickUntil) return;
		if (floating?.isConnected) hide();
		else {
			clearShowTimer();
			show('pointer');
		}
	}

	function init(p) {
		currentParams = p;
		if (!p?.getContent) return;
		node.addEventListener('pointerenter', onRefPointerEnter);
		node.addEventListener('pointerleave', onRefPointerLeave);
		node.addEventListener('focusin', onRefFocusIn);
		node.addEventListener('focusout', onRefFocusOut);
		node.addEventListener('pointerdown', onRefPointerDown);
		node.addEventListener('click', onRefClick);
	}

	function destroy() {
		clearShowTimer();
		clearHideTimer();
		node.removeEventListener('pointerenter', onRefPointerEnter);
		node.removeEventListener('pointerleave', onRefPointerLeave);
		node.removeEventListener('focusin', onRefFocusIn);
		node.removeEventListener('focusout', onRefFocusOut);
		node.removeEventListener('pointerdown', onRefPointerDown);
		node.removeEventListener('click', onRefClick);
		teardownFloating();
		currentParams = null;
	}

	init(params);

	return {
		update(next) {
			const wasOpen = !!floating?.isConnected;
			currentParams = next;
			if (!next?.getContent) {
				hide();
				return;
			}
			if (wasOpen) {
				const mw = next.options?.maxWidth;
				if (floating) {
					if (mw != null) floating.style.setProperty('--everviz-tooltip-max-width', `${mw}px`);
					else floating.style.removeProperty('--everviz-tooltip-max-width');
					const accent = next.accentColor;
					if (accent) floating.style.setProperty('--tooltip-accent', accent);
					else floating.style.removeProperty('--tooltip-accent');
				}
				refreshContent();
				void positionNow();
			}
		},
		destroy,
	};
}

/**
 * @typedef {object} EvervizFloatingTooltipParams
 * @property {() => HTMLElement} getContent
 * @property {string | null} [accentColor]
 * @property {object} [options]
 * @property {number} [options.maxWidth]
 * @property {boolean} [options.interactive]
 * @property {HTMLElement | (() => HTMLElement)} [options.appendTo]
 * @property {'top'|'bottom'|'left'|'right'} [options.placement]
 * @property {{ strategy?: 'absolute' | 'fixed' }} [options.popperOptions]
 * @property {(ctx: { floating: HTMLElement }) => void} [options.onShow]
 */
