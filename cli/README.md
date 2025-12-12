# Press3 CLI (Bun)

Utility entry point for automating deployments, renewals, and indexing for the Press3 CMS.

## Commands

```bash
bun run index.ts deploy --config press3.config.json
bun run index.ts assign-domain --domain docs.press3.sui --target walrus://blob/site
bun run index.ts renew --batch-size 50 --dry-run
bun run index.ts index --output dist/search-index.json
```

Each command currently logs the action so the workflows can be wired up while Move + Walrus plumbing is implemented.

## Development

```bash
bun install
bun run index.ts help
```

Roadmap:
1. Load a shared JSON config (Walrus API keys, contract IDs, domains).
2. Implement Walrus quilt deployments, returning blob IDs for the Move contract.
3. Build multi-transaction batches for renewals and index uploads.
4. Share utility modules with the frontend (schemas, types) to avoid drift.
