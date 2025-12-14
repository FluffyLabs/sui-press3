# Getting started

This guide spins up a self-contained Press3 environment—the Move package, the Walrus-hosted frontends, and the default content. Every command runs from the `cli/` directory and targets Sui **testnet** unless you override the RPC profile.

## Before you begin

1. Install the tools listed in `1-requirements.md` (Bun, Sui CLI, optional Walrus utilities).
2. Clone the repo and install dependencies:
   ```bash
   cd cli
   bun install
   ```
3. Make sure your Sui CLI points at the right network: `sui client active-env`.

## Step 1 – Deploy the core contract

Run the `init` helper to publish the Move package and seed demo content:

```bash
bun run press3 init --demo
```

What it does:

- Builds and publishes the Press3 contract to Sui testnet.
- Creates the shared Press3 object plus an admin key derived from your Sui account.
- Registers a sample homepage that points at a Walrus placeholder blob so the renderer has something to load.

## Step 2 – Ship the Walrus frontends

The public renderer and backoffice ship as Walrus quilts. If you already have the `walrus-site-builder` installed, just run:

```bash
bun run press3 deploy --use-cli
```

This command builds the React bundle, packages it with `site-builder`, uploads it to Walrus, and records the blob ID locally for later updates.

## Step 3 – Verify the deployment

1. Open the Walrus portal UI (or your preferred gateway) and paste the blob ID printed by the deploy step to view the public site.
2. Navigate to `/admin` on the same domain to reach the backoffice dashboard.
3. Connect the same wallet/account you used for `init`; the app will detect your admin role via the contract.

You now have a fully functional Press3 stack: contract + renderer + admin. Head back to `cli/` for commands like `update`, `promote`, or `batch-publish-update` once you’re ready to publish real content.
