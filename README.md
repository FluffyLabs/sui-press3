# Press3

Press3 is a decentralized CMS built on Sui with Walrus storage. The project contains three collaborative workspaces:

- `contract/` – Sui Move package managing page ownership, Walrus blob references, editor permissions, and events.
- `frontend/` – Vite + React application serving as both public content renderer and admin backoffice editor.
- `cli/` – Bun-based tooling for contract deployment, Walrus publishing, page management, and batch operations.

See `AGENTS.md` for the full project context and requirements shared across AI agents.

## [Documentation](./docs/sidenav.md)

## Features

### ✅ Implemented
- **Smart Contract**: Page registration, updates, editor management, admin controls
- **Frontend**: Public renderer with layout support (CMS, Wiki), admin panel, page creation/editing, wallet integration
- **CLI**: Contract deployment, Walrus publishing, page updates, batch operations, editor promotion
- **Content**: HTML, Markdown, JSON, Image, and Raw content rendering
- **Storage**: Full Walrus integration for decentralized content storage

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173/admin` for the admin panel or `http://localhost:5173/` for the public renderer.

### Smart Contract
```bash
cd contract
sui move test
sui move build
# Publish with CLI tool
cd ../cli
bun run index.ts contract
```

### CLI
```bash
cd cli
bun install
bun run index.ts help
```

The CLI uses environment variables for configuration. Copy `.env.example` to `.env` and configure:
- `WALRUS_PUBLISH_SECRET` - Your Sui private key
- `WALRUS_EPOCHS` - Storage duration (default: 1)
- `WALRUS_NETWORK` - Network to use (default: testnet)

## Project Status

### Working Features
- ✅ Smart contract with page registry and permission system
- ✅ Frontend public renderer with multiple layout types
- ✅ Admin panel for page creation and editing
- ✅ Wallet integration (Sui wallet support)
- ✅ Walrus content upload and retrieval
- ✅ CLI commands: init, deploy, publish, retrieve, contract, update, promote, batch-publish-update
- ✅ Content renderers for HTML, Markdown, JSON, images, and raw content

### In Progress / Planned
- 🚧 Search indexing and deployment
- 🚧 Auto-renewal of Walrus blobs
- 🚧 Domain assignment and NS records
- 🚧 Edit queue workflow for proposed changes
- 🚧 Version history and diffs

## CI
- `.github/workflows/cli.yml` runs on pushes/PRs touching the CLI. It installs Bun, lints with Biome, compiles the binary via `bun build`, and executes `bun test`. Keep the CLI scripts up to date so the workflow mirrors local expectations.
