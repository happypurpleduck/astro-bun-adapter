# astro-bun-adapter

This adapter allows Astro to deploy your SSR site to Bun targets.
(Based on Deno adapter)

- **[Installation](#installation)**
- **[Usage](#usage)**
- **[Configuration](#configuration)**

## Installation

Add the Bun adapter to enable SSR in your Astro project with the following
steps:

1. Install the Bun adapter to your project’s dependencies.

   ```bash
   bun install @purpleduck/astro-bun-adapter
   ```

1. Update your `astro.config.mjs` project configuration file with the changes
   below.

   ```js ins={3,6-7}
   // astro.config.mjs
   import { defineConfig } from "astro/config";
   import bun from "@purpleduck/astro-bun-adapter";

   export default defineConfig({
     output: "server",
     adapter: bun(),
   });
   ```

Next, update your `preview` script in `package.json` to run `bun`:

```json ins={8}
// package.json
{
  // ...
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "bun run ./dist/server/entry.mjs"
  }
}
```

You can now use this command to preview your production Astro site locally with
Bun.

```bash
npm run preview
```

## Usage

After
[performing a build](https://docs.astro.build/en/guides/deploy/#building-your-site-locally)
there will be a `dist/server/entry.mjs` module. You can start a server by
importing this module in your Bun app:

```js
import "./dist/server/entry.mjs";
```

See the `start` option below for how you can have more control over starting the
Astro server.

You can also run the script directly using Bun:

```sh
bun run ./dist/server/entry.mjs
```

## Configuration

To configure this adapter, pass an object to the `bun()` function call in
`astro.config.mjs`.

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import bun from "@purpleduck/astro-bun-adapter";

export default defineConfig({
  output: "server",
  adapter: bun({
    //options go here
  }),
});
```

### start

This adapter automatically starts a server when it is imported. You can turn
this off with the `start` option:

```js
import { defineConfig } from "astro/config";
import bun from "@purpleduck/astro-bun-adapter";

export default defineConfig({
  output: "server",
  adapter: bun({
    start: false,
  }),
});
```

If you disable this, you need to write your own Bun web server. Import and call
`handle` from the generated entry script to render requests:

```ts
import { handle } from "./dist/server/entry.mjs";

Bun.serve({
  fetch: handle,
});
```

### port and hostname

You can set the port (default: `3000`) and hostname (default: `0.0.0.0`) for the
bun server to use. If `start` is false, this has no effect; your own server
must configure the port and hostname.

```js
import { defineConfig } from "astro/config";
import bun from "@purpleduck/astro-bun-adapter";

export default defineConfig({
  output: "server",
  adapter: bun({
    port: 8081,
    hostname: "myhost",
  }),
});
```

### esbuild options

You can customize esbuild options by passing an object to the `esbuild` option.
This object is passed directly to esbuild's `build` function. See the
[esbuild documentation](https://esbuild.github.io/api/#build) for more
information.

```js
import { defineConfig } from "astro/config";
import bun from "@purpleduck/astro-bun-adapter";

export default defineConfig({
  output: "server",
  adapter: bun({
    esbuild: {
      // options go here
    },
  }),
});
```
