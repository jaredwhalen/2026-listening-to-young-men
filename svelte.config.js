import adapterStatic from "@sveltejs/adapter-static";

/** GitHub project pages: `https://<user>.github.io/<repo>/` → build with e.g. `BASE_PATH=/<repo>`. */
const base = process.env.BASE_PATH?.replace(/\/$/, "") ?? "";

const config = {
	kit: {
		...(base ? { paths: { base } } : {}),
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapterStatic({ 
			strict: false,
			pages: 'dist',
			assets: 'dist'
		}),
		// Remove inline bundling for WordPress compatibility
		// output: {
		// 	bundleStrategy: 'inline'
		// }
	}
};

export default config;
