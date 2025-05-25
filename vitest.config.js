import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
		exclude: [
			"node_modules",
			"dist",
			".idea",
			".git",
			".cache",
			"frontend-shipping/*",
		],
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "test/"],
		},
	},
});
