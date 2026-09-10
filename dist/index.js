import { createRlmExtensionFactory } from "./src/install.js";
export * from "./src/types.js";
export { createRlmExtensionFactory } from "./src/install.js";
export function createRlmExtension(options = {}) {
	return createRlmExtensionFactory({
		depth: 0,
		maxDepth: options.maxDepth ?? 2,
		root: true,
		promptMode: options.promptMode ?? "balanced",
	});
}
export default function rlmExtension(pi) {
	return createRlmExtension()(pi);
}
//# sourceMappingURL=index.js.map
