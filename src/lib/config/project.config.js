// Lives under src/ so Vite can import it in dev without fs restrictions.

const project = {
	meta: {
		title: 'Listening To Young Men | Visuals', // <title> (npm run setup)
		description: "Repo for all interactive graphics.", // meta description (npm run setup)
	},

	document: {
		mode: 'standalone', // 'standalone' | 'inline' — inline skips Google Fonts (host owns typography)
		includeViewportMeta: true,
		includeGoogleFonts: true, // only when mode is standalone
		googleFontHref:
			'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap'
	},

	layout: {
		mode: 'full', // 'column' | 'full' — column: max-width + flush start; full: no max-width on app root
		maxWidthPx: 800, // used when mode is 'column'
		horizontalPadding: '1rem' // CSS length; use '0' for flush edges in full layout
	},

	build: {
		cdnBaseUrl: 'https://cdn.jsdelivr.net/gh/jaredwhalen/2026-listening-to-young-men@main/dist/', // published dist/ base; used by tasks/generate-embed.js (npm run setup)
		embedContainerId: 'svelte-app-container' // DOM id for the WordPress embed mount node
	}
};

export default project;
