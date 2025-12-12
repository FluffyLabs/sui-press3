# Press3

Press3 is a decentralized CMS built on Sui with Walrus storage. The project contains three collaborative workspaces:

- `contract/` – Sui Move package driving page ownership, Walrus blob references, and access control events.
- `frontend/` – Vite + React shell that will grow into both the public renderer and the backoffice editor.
- `cli/` – Bun-based tooling for deploying Walrus sites, managing domains, auto-renewals, and search indexing.

See `AGENTS.md` for the full requirement brief shared across AI agents.

## Quick Start

### Frontend
```bash
cd frontend
npm install # already run during scaffolding; repeat if deps change
npm run dev
```

### Smart Contract
```bash
cd contract
sui move test
sui client publish --gas-budget <budget>
```

### CLI
```bash
cd cli
bun install
bun run index.ts help
```

The CLI uses `press3.config.example.json` as a template for Walrus endpoints, package IDs, and renewal settings.

## Next Milestones
1. Flesh out the Move module with page/subpage objects, permission delegation, and Walrus quilt metadata.
2. Wire the frontend mock data to live Sui events plus Walrus fetchers (HTML/Markdown + asset injection).
3. Implement the Bun CLI workflows: deploy quilts, assign domains, auto-renew blobs, and publish search indexes.
4. Share schemas/types across contract, frontend, and CLI to ensure access control and metadata stay consistent.
