import type { ExecResult, GlobalsInspection, LlmQueryFunction, RuntimeSnapshot } from "./types.js";
export declare class RuntimeSession {
	private worker;
	private requestCounter;
	private pending;
	private currentLlmQuery?;
	private lastSnapshot;
	constructor();
	private createWorker;
	private restart;
	private onMessage;
	private request;
	exec(
		code: string,
		hooks?: {
			llmQuery?: LlmQueryFunction;
		},
	): Promise<ExecResult>;
	inspect(): Promise<GlobalsInspection>;
	restore(snapshot: RuntimeSnapshot): Promise<void>;
	reset(): Promise<void>;
	getSnapshot(): RuntimeSnapshot;
	dispose(): Promise<void>;
}
export declare class RuntimeManager {
	private sessions;
	getOrCreate(key: string): RuntimeSession;
	dispose(key: string): Promise<void>;
	disposeAll(): Promise<void>;
}
//# sourceMappingURL=runtime.d.ts.map
