# Press3 CLI (Bun)

Utility entry point for automating deployments, renewals, and indexing for the Press3 CMS.

## Commands

```bash
bun run index.ts deploy
bun run index.ts deploy --use-sdk  # Deploy using SDK instead of site-builder
bun run index.ts assign-domain --domain docs.press3.sui --target walrus://blob/site
bun run index.ts renew --batch-size 50 --dry-run
bun run index.ts index --output dist/search-index.json
```

Each command currently logs the action so the workflows can be wired up while Move + Walrus plumbing is implemented.

## Configuration

The CLI can be configured using environment variables. Create a `.env` file in the project root:

```env
WALRUS_PUBLISH_SECRET=your_sui_private_key_here
WALRUS_EPOCHS=5
WALRUS_NETWORK=testnet
```

### Environment Variables

- **WALRUS_PUBLISH_SECRET** - Your Sui private key for publishing to Walrus (required for deployment)
- **WALRUS_EPOCHS** - Number of epochs to store blobs (default: 1, must be a positive integer)
- **WALRUS_NETWORK** - Target Walrus network (default: `testnet`, options: `testnet`, `mainnet`)

## Development

```bash
bun install
bun run index.ts help   # smoke-test commands
bun run lint            # Biome formatting + lint rules
bun run test            # Bun test harness (see tests/*)
bun run build           # Produces dist/press3 binary for deployment
```

The lint step is powered by [Biome](https://biomejs.dev/) and matches the settings enforced in CI.

Roadmap:
1. Load a shared JSON config (Walrus API keys, contract IDs, domains).
2. Implement Walrus quilt deployments, returning blob IDs for the Move contract.
3. Build multi-transaction batches for renewals and index uploads.
4. Share utility modules with the frontend (schemas, types) to avoid drift.
