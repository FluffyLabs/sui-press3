# Press3 CLI (Bun)

Command-line tool for managing Press3 CMS deployments, pages, and Walrus storage.

## Commands

### Initialization & Deployment

```bash
# Initialize Press3 (build contract, deploy frontend, register homepage)
bun run press3 init --home <blob-id>           # Set specific homepage
bun run press3 init --demo                     # Setup with demo content
bun run press3 init --output custom-config.log # Save config to custom location

# Deploy frontend to Walrus
bun run press3 deploy
bun run press3 deploy --use-cli  # Deploy using site-builder instead of SDK

# Build and publish the Move contract to SUI
bun run press3 contract                  # Uses SDK with WALRUS_PUBLISH_SECRET (default)
bun run press3 contract --use-cli        # Uses sui CLI (requires active sui client config)
bun run press3 contract --dry-run        # Build only, skip publishing
```

### Content Management

```bash
# Publish a single file to Walrus
bun run press3 publish --file path/to/file.txt

# Update an existing page or register a new one
bun run press3 update --path /about.html --blob-id <new-blob-id>

# Batch upload directory and update/register pages
bun run press3 batch-publish-update --dir ./content

# Retrieve a blob from Walrus
bun run press3 retrieve --blob-id <blob-id>
bun run press3 retrieve --blob-id <blob-id> --output path/to/save.txt
```

### Editor Management

```bash
# Add editors to a page
bun run press3 promote --path /docs/intro.md --add 0xaddr1,0xaddr2

# Remove editors from a page
bun run press3 promote --path /docs/intro.md --remove 0xaddr3

# Add and remove editors in one command
bun run press3 promote --path /docs/intro.md --add 0xnew --remove 0xold
```

### Future Commands (Not Yet Implemented)

```bash
# Domain management
bun run press3 assign-domain --domain docs.press3.sui --target walrus://blob/site

# Blob management
bun run press3 renew --batch-size 50 --dry-run

# Search indexing
bun run press3 index --output dist/search-index.json
```

## Command Details

### init
Complete initialization workflow that:
- Builds and publishes the Move smart contract to SUI
- Builds and deploys the frontend to Walrus
- Registers the homepage with the specified Walrus blob
- Saves configuration (package ID, Press3 object ID, Walrus blob ID) to a log file

**Options:**
- `--home <blob-id>` - Walrus blob ID to set as homepage (required unless using --demo)
- `--demo` - Setup with initial demo content (homepage, index.html, article.md)
- `--output <path>` - Path to save configuration file (default: press3.init.log)

### update
Updates an existing page's Walrus blob ID or registers a new page if it doesn't exist.

**Options:**
- `--path <path>` - Page path (e.g., /about.html) (required)
- `--blob-id <id>` - New Walrus blob ID (required)

### promote
Manages editor permissions for a specific page. Only admins can promote/demote editors.

**Options:**
- `--path <path>` - Page path to manage editors for (required)
- `--add <addresses>` - Comma-separated list of Sui addresses to add as editors
- `--remove <addresses>` - Comma-separated list of Sui addresses to remove

### batch-publish-update
Traverses a directory, uploads all files to Walrus, and updates/registers pages in a single transaction.

**Options:**
- `--dir <path>` - Directory path to traverse and upload files from (required)

### retrieve
Downloads a blob from Walrus by blob ID. If `--output` is specified, saves to a file; otherwise prints to stdout.

**Options:**
- `--blob-id <id>` - Blob ID to retrieve (required)
- `--output <path>` - Path to save the retrieved blob (optional)

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
