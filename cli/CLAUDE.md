
## Working with Claude Code

When working with this codebase using Claude Code (the CLI tool):

- **Break down complex tasks**: For multi-file changes or architectural decisions, use the planning workflow
- **Quality checks**: Always run `bun run typecheck` and `bun run lint` before considering a task complete
- **Test changes**: Use `--dry-run` flags when available to test without side effects
- **Incremental development**: Build features incrementally, testing each step before moving forward
- **Documentation**: Update README.md when adding new commands or changing user-facing behavior

### Common Workflows

**Adding a new CLI command:**
1. Create `src/cmd-<name>.ts` with a thin handler function
2. Add utility functions to appropriate modules (`sui.ts`, `walrus.ts`, etc.)
3. Register command in `src/run.ts` (add to Command type, parseArgs, switch statement, and HELP_TEXT)
4. Update `README.md` with command documentation
5. Run quality checks: `bun run typecheck && bun run lint`
6. Test with `--dry-run` if applicable

**Refactoring:**
1. Identify common patterns and duplicate code
2. Extract to utility modules with clear, focused functions
3. Update all call sites to use the new utilities
4. Verify with quality checks and functional tests
5. Update CLAUDE.md if introducing new patterns

## Bun Usage

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Code Organization

### Command Handlers

Command handlers (`cmd-*.ts`) should be thin and delegate to utility modules:

```ts
// GOOD: Thin handler that delegates to utilities
export async function handleContract(flags: Record<string, string | boolean>) {
  const config = DEFAULT_CONFIG;
  await buildMoveContract(contractDir);
  const result = await publishMovePackage({ client, signer, modules });
  displayPublishResult(result, network);
}

// BAD: Handler with all logic inline
export async function handleContract(flags: Record<string, string | boolean>) {
  // 200 lines of inline logic...
}
```

### Utility Modules

Create domain-specific utility modules for reusable functionality:

- **sui.ts** - SUI blockchain operations (publishing contracts, creating clients, extracting data)
- **walrus.ts** - Walrus operations (file uploads, keypair loading)
- **config.ts** - Configuration and environment variable management
- **utils.ts** - General-purpose utilities

### SDK vs CLI Pattern

Commands that interact with external services should support both CLI and SDK approaches:

```ts
if (!useSdk) {
  logStep('Action', 'Using CLI tool. Use --use-sdk for SDK approach');
  await performActionWithCli();
} else {
  logStep('Action', 'Using SDK...');
  await performActionWithSdk();
}
```

- **CLI approach**: Uses external tools (e.g., `sui client publish`)
  - Pros: Simple, uses user's existing configuration
  - Cons: Requires external tools to be installed

- **SDK approach**: Uses JavaScript SDKs with `WALRUS_PUBLISH_SECRET`
  - Pros: Self-contained, works in CI/CD without configuration
  - Cons: Requires secret management

### Type Safety

- Export types from utility modules for reuse
- Use TypeScript interfaces for complex data structures
- Prefer `type` over `interface` for simple type aliases

```ts
// sui.ts
export interface SuiPublishResult {
  digest: string;
  objectChanges?: Array<{
    type: string;
    packageId?: string;
  }> | null;
}

// cmd-contract.ts
import { type SuiPublishResult } from './sui';
```
