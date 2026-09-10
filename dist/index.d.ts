import type { ExtensionAPI, ExtensionFactory } from "@earendil-works/pi-coding-agent";
import type { RlmExtensionOptions } from "./src/types.js";
export * from "./src/types.js";
export { createRlmExtensionFactory } from "./src/install.js";
export declare function createRlmExtension(options?: RlmExtensionOptions): ExtensionFactory;
export default function rlmExtension(pi: ExtensionAPI): void | Promise<void>;
//# sourceMappingURL=index.d.ts.map