import type { SSRManifest } from "astro";
import type { Options } from "./types.ts";
export declare function start(manifest: SSRManifest, options: Options): void;
export declare function createExports(manifest: SSRManifest, options: Options): {
    stop(): Promise<void>;
    running(): boolean;
    start(): Promise<void>;
    handle(request: Request): Promise<Response>;
};
