/**
 * Must be prerendered for static hosts (e.g. GitHub Pages): otherwise no
 * `dotplot-interactive/index.html` is emitted and `/dotplot-interactive` 404s.
 * `?section=` and in-page state are resolved in the browser after load.
 */
export const prerender = true;
