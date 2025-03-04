import { readdir } from "node:fs/promises";
import type { SSRManifest } from "astro";
import { App } from "astro/app";
import type { Server } from "bun";
import type { Options } from "./types.ts";

let _server: Server | undefined = undefined;

async function* getPrerenderedFiles(clientRoot: URL): AsyncGenerator<URL> {
	for (const ent of await readdir(clientRoot, { withFileTypes: true })) {
		if (ent.isDirectory()) {
			yield* getPrerenderedFiles(new URL(`./${ent.name}/`, clientRoot));
		} else if (ent.name.endsWith(".html")) {
			yield new URL(`./${ent.name}`, clientRoot);
		}
	}
}

function removeTrailingForwardSlash(path: string) {
	return path.endsWith("/") ? path.slice(0, path.length - 1) : path;
}

export function start(manifest: SSRManifest, options: Options) {
	if (options.start === false) {
		return;
	}

	const clientRoot = new URL("../client/", import.meta.url);
	const app = new App(manifest);
	const handler = async (request: Request, server: Server) => {
		if (app.match(request)) {
			// TOOD: is this even correct?
			if (server) {
				const hostname = server.requestIP(request);
				Reflect.set(request, Symbol.for("astro.clientAddress"), hostname);
			}
			// TODO: bun version?
			// const hostname = handlerInfo.remoteAddr?.hostname;
			// Reflect.set(request, Symbol.for("astro.clientAddress"), hostname);

			const response = await app.render(request);
			if (app.setCookieHeaders) {
				for (const setCookieHeader of app.setCookieHeaders(response)) {
					response.headers.append("Set-Cookie", setCookieHeader);
				}
			}
			return response;
		}

		const url = new URL(request.url);
		const localPath = new URL(`./${app.removeBase(url.pathname)}`, clientRoot);

		const file = Bun.file(localPath);
		if (await file.exists()) {
			return new Response(file);
		}

		let fallback: URL | undefined = undefined;
		for await (const file of getPrerenderedFiles(clientRoot)) {
			const pathname = file.pathname.replace(/\/(index)?\.html$/, "");
			if (removeTrailingForwardSlash(localPath.pathname).endsWith(pathname)) {
				fallback = file;
				break;
			}
		}
		if (fallback) {
			return new Response(Bun.file(fallback));
		}

		const response = await app.render(request);

		if (app.setCookieHeaders) {
			for (const setCookieHeader of app.setCookieHeaders(response)) {
				response.headers.append("Set-Cookie", setCookieHeader);
			}
		}

		return response;
	};

	const port = options.port ?? 3000;
	const hostname = options.hostname ?? "0.0.0.0";

	_server = Bun.serve({
		port,
		hostname,
		fetch: handler,
	});

	console.info(`Server running on port ${port}`);
}

export function createExports(manifest: SSRManifest, options: Options) {
	const app = new App(manifest);

	return {
		async stop() {
			if (_server) {
				await _server.stop();
				_server = undefined;
			}
		},
		running() {
			return _server !== undefined;
		},
		async start() {
			return start(manifest, options);
		},
		async handle(request: Request) {
			return app.render(request);
		},
	};
}
