
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
3. Register command in `src/run.ts`:
   - Add to `Command` type
   - Add to `parseArgs` whitelist array
   - Add case to switch statement
   - Add to HELP_TEXT with description and options
4. Update `README.md` with command documentation
5. Run quality checks: `bun run typecheck && bun run lint` (if available)
6. Test with `--dry-run` if applicable

**Example implemented commands:**
- `init` - Complete initialization workflow
- `contract` - Build and publish Move contract
- `update` - Update existing page or register new one
- `promote` - Manage editors for pages
- `batch-publish-update` - Batch upload and update pages

**Refactoring:**
1. Identify common patterns and duplicate code
2. Extract to utility modules with clear, focused functions:
   - `sui.ts` - SUI blockchain operations
   - `walrus.ts` - Walrus storage operations
   - `config.ts` - Configuration management
   - `utils.ts` - General utilities
3. Update all call sites to use the new utilities
4. Verify with quality checks and functional tests
5. Update CLAUDE.md if introducing new patterns

**Recent Refactorings:**
- Extracted SUI client creation to `sui.ts`
- Centralized contract publishing logic in `sui.ts`
- Added `buildPromoteTransaction` helper for editor management
- Created reusable transaction builders

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

### Current Structure

**Command Handlers** (`cmd-*.ts`):
- `cmd-init.ts` - Complete initialization workflow
- `cmd-contract.ts` - Contract building and publishing
- `cmd-deploy.ts` - Frontend deployment to Walrus
- `cmd-publish.ts` - Single file upload to Walrus
- `cmd-retrieve.ts` - Download blob from Walrus
- `cmd-update.ts` - Update/register pages
- `cmd-promote.ts` - Manage page editors
- `cmd-batch-publish-update.ts` - Batch directory upload and update

**Utility Modules**:
- `sui.ts` - SUI client, contract publishing, transaction building
- `walrus.ts` - Walrus file operations and keypair management
- `config.ts` - Configuration and environment variables
- `types.ts` - Shared type definitions
- `utils.ts` - General-purpose helpers
- `logger.ts` - Logging utilities
- `run.ts` - CLI argument parsing and command routing

### Best Practices

Command handlers should be thin and delegate to utility modules:

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

Commands that interact with external services should support both SDK (default) and CLI approaches:

```ts
if (useCli) {
  logStep('Action', 'Using CLI tool. As an alternative use SDK (default)');
  await performActionWithCli();
} else {
  logStep('Action', 'Using SDK...');
  await performActionWithSdk();
}
```

- **SDK approach** (default): Uses JavaScript SDKs with `WALRUS_PUBLISH_SECRET`
  - Pros: Self-contained, works in CI/CD without configuration
  - Cons: Requires secret management

- **CLI approach**: Uses external tools (e.g., `sui client publish`) via `--use-cli` flag
  - Pros: Simple, uses user's existing configuration
  - Cons: Requires external tools to be installed

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
