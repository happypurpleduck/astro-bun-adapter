import type { AstroAdapter, AstroIntegration } from "astro";
import type { Options } from "./types.ts";
export declare function getAdapter(args?: Options): AstroAdapter;
export default function createIntegration(args?: Options): AstroIntegration;
