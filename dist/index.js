import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import { mergeObjects } from "./helpers.js";
export function getAdapter(args) {
    return {
        name: "astro-bun-adapter",
        serverEntrypoint: "astro-bun-adapter/server.ts",
        args: args ?? {},
        exports: ["stop", "handle", "start", "running"],
        supportedAstroFeatures: {
            hybridOutput: "stable",
            // TODO: test
            i18nDomains: "stable",
            staticOutput: "stable",
            serverOutput: "stable",
            // TODO: test
            sharpImageService: "stable",
            // TODO: ?
            envGetSecret: "unsupported",
        },
    };
}
export default function createIntegration(args) {
    let _buildConfig;
    let _vite;
    return {
        name: "astro-bun-adapter",
        hooks: {
            "astro:config:done": ({ setAdapter, config }) => {
                setAdapter(getAdapter(args));
                _buildConfig = config.build;
            },
            "astro:build:setup": ({ vite, target }) => {
                if (target === "server") {
                    _vite = vite;
                    vite.resolve = vite.resolve ?? {};
                    vite.resolve.alias = vite.resolve.alias ?? {};
                    vite.build = vite.build ?? {};
                    vite.build.rollupOptions = vite.build.rollupOptions ?? {};
                    vite.build.rollupOptions.external =
                        vite.build.rollupOptions.external ?? [];
                    const aliases = [
                        {
                            find: "react-dom/server",
                            replacement: "react-dom/server.browser",
                        },
                    ];
                    if (Array.isArray(vite.resolve.alias)) {
                        vite.resolve.alias = [...vite.resolve.alias, ...aliases];
                    }
                    else {
                        for (const alias of aliases) {
                            vite.resolve.alias[alias.find] =
                                alias.replacement;
                        }
                    }
                    if (Array.isArray(vite.build.rollupOptions.external)) {
                    }
                    else if (typeof vite.build.rollupOptions.external !== "function") {
                        vite.build.rollupOptions.external = [
                            vite.build.rollupOptions.external,
                        ];
                    }
                }
            },
            "astro:build:done": async () => {
                const entryUrl = new URL(_buildConfig.serverEntry, _buildConfig.server);
                const pth = fileURLToPath(entryUrl);
                const esbuildConfig = mergeObjects({
                    target: "esnext",
                    platform: "node",
                    entryPoints: [pth],
                    outfile: pth,
                    allowOverwrite: true,
                    format: "esm",
                    bundle: true,
                    external: [
                        // ...COMPATIBLE_NODE_MODULES.map((mod) => `node:${mod}`),
                        "@astrojs/markdown-remark",
                    ],
                    logOverride: {
                        "ignored-bare-import": "silent",
                    },
                }, args?.esbuild || {});
                await esbuild.build(esbuildConfig);
                // Remove chunks, if they exist. Since we have bundled via esbuild these chunks are trash.
                try {
                    if (Array.isArray(_vite?.build?.rollupOptions?.output)) {
                        for (const output of _vite.build.rollupOptions.output) {
                            await delete_chunk(
                            // @ts-expect-error
                            output, _buildConfig.server);
                        }
                    }
                    else if (_vite?.build?.rollupOptions?.output) {
                        await delete_chunk(
                        // @ts-expect-error
                        _vite.build.rollupOptions.output, _buildConfig.server);
                    }
                }
                catch { }
            },
        },
    };
}
async function delete_chunk(output, server_url) {
    const chunkFileNames = typeof output.chunkFileNames === "string"
        ? output.chunkFileNames
        : "chunks/chunk.[hash].mjs";
    const chunkPath = dirname(chunkFileNames);
    const chunksDirUrl = new URL(`${chunkPath}/`, server_url);
    await rm(chunksDirUrl, {
        recursive: true,
        force: true,
    });
}
