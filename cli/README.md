# Press3 CLI (Bun)

Utility entry point for automating deployments, renewals, and indexing for the Press3 CMS.

## Commands

```bash
# Deploy frontend to Walrus
bun run press3 deploy
bun run press3 deploy --use-cli  # Deploy using site-builder instead of SDK

# Publish a single file to Walrus
bun run press3 publish --file path/to/file.txt

# Build and publish the Move contract to SUI
bun run press3 contract                  # Uses SDK with WALRUS_PUBLISH_SECRET (default)
bun run press3 contract --use-cli        # Uses sui CLI (requires active sui client config)
bun run press3 contract --dry-run        # Build only, skip publishing

# Domain management
bun run press3 assign-domain --domain docs.press3.sui --target walrus://blob/site

# Blob management
bun run press3 renew --batch-size 50 --dry-run

# Search indexing
bun run press3 index --output dist/search-index.json
```

Each command logs its actions. The `contract` command is fully implemented and can publish Move packages to SUI networks.

## Configuration

The CLI can be configured using environment variables. Create a `.env` file in the project root:

```env
WALRUS_PUBLISH_SECRET=your_sui_private_key_here
WALRUS_EPOCHS=5
WALRUS_NETWORK=testnet
```

### Environment Variables

- **WALRUS_PUBLISH_SECRET** - Your Sui private key for publishing to Walrus and SUI (required for SDK mode, which is the default)
  - Supports multiple formats: `suiprivkey1...`, `ed25519:...`, `0x...` (hex), or base64
- **WALRUS_EPOCHS** - Number of epochs to store blobs (default: 1, must be a positive integer)
- **WALRUS_NETWORK** - Target network for both Walrus and SUI operations (default: `testnet`, options: `testnet`, `mainnet`)

## Development

```bash
bun install
bun run index.ts help   # smoke-test commands
bun run lint            # Biome formatting + lint rules
bun run test            # Bun test harness (see tests/*)
bun run build           # Produces dist/press3 binary for deployment
```

The lint step is powered by [Biome](https://biomejs.dev/) and matches the settings enforced in CI.

## Project Structure

- **src/cmd-*.ts** - Command handlers for each CLI command
- **src/sui.ts** - SUI blockchain utilities (contract publishing, client creation)
- **src/walrus.ts** - Walrus utilities (file uploads, keypair loading)
- **src/config.ts** - Configuration management and environment variable handling
  - `frontendDir` - Location of frontend code (default: `../frontend`)
  - `contractDir` - Location of Move contract (default: `../contract`)
- **src/logger.ts** - Logging utilities
- **src/utils.ts** - General utility functions

Roadmap:
1. Load a shared JSON config (Walrus API keys, contract IDs, domains).
2. Implement Walrus quilt deployments, returning blob IDs for the Move contract.
3. Build multi-transaction batches for renewals and index uploads.
4. Share utility modules with the frontend (schemas, types) to avoid drift.
