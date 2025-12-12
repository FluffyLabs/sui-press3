# Press3 Project Context

This repository hosts **Press3**, a decentralized CMS built on SUI with Walrus storage. The system combines three main components:

1. **Smart contract package** – manages pages, permissions, Walrus blobs, edit queues, and emits events for frontends.
2. **Walrus-hosted frontends** – both a public site renderer and an editorial backoffice.
3. **Bun-powered CLI & tooling** – automates deployments, domain assignment, renewals, and indexing.

The following requirements capture the initial hackathon scope and should remain synchronized with active development.

## Core Requirements

### Content & Access
- Support public or private visibility modes. Consider sponsored transactions so editors can zkLogin without paying gas.
- Payments: define who funds new content, renewals, and edits. Enable contract-sponsored transactions.
- Editing workflow: editors propose changes into a queue; authorized users approve and publish.
- Storage strategy: allow Walrus quilts (multi-file blobs). Consider grouping related files to share permissions. Small artefacts (comments) may go on-chain.
- Indexing: determine whether to maintain an off-chain indexer for discoverability and search metadata.
- Editing history: track version diffs so previous states remain accessible.

### Product Modes
- **Wikipedia/Wordpress/Blog**: public content, hierarchical editors, deployer funds operations.
- **Company Website**: structured layout, public, deployer-funded edits.
- **Crowd-sourced Wikipedia**: each page maintains its own balance (crowd-funding); tombstone when unfunded.
- **Dark Wikipedia / Directory / Reddit**: pay-to-list directory stored on-chain; contract escrows listing funds and can finance its Walrus frontend.
- **Forum / Discussion**: threads with comments, author edits, moderator removals, hierarchical ownership.

### Components Overview
- **Smart Contract**: tracks `page -> walrus blob id`, access rights, edit queues, page configuration.
- **Content Display Frontend**: resolves page events, fetches Walrus blobs, renders HTML/Markdown, handles menus, sidebars, search metadata, dynamic asset resolution, quilt paths, and search integration.
- **Backoffice Frontend**: full-featured editor with rich text/media uploads, permission-aware save button, Walrus upload, and contract updates; supports page creation, access management (users/groups), and moderator hierarchies.
- **Search Indexer**: scans Walrus blobs, builds compressed search index, redeploys to Walrus.
- **Deployment Tooling**: deploy CMS instances, manage namespace routing, auto-renew content.

## Smart Contract MVP Tasks
- Init contract with admin role, emit initial `/index.html` page event and `/ -> /index.html` redirect.
- Register new top-level routes (`/<name>`) restricted to admin; emit events.
- Allow admin to grant/revoke top-level access to users/groups; nested permissions allow `/abc/<xyz>` registration if `/abc` rights exist.
- Editing: authorized users update Walrus content references per page or quilt file path.
- Manage edit queues (optional) and ensure permissions are transferable by wallet ownership.
- Research multisig-style group permissions.
- Support Walrus quilt references (specific file pointers), cheaper deployments.
- Ensure ownership is transferable and censorship-resistant.

## Frontend (Public Renderer)
- Connect to contract, display page events, fetch Walrus content, render `/` default.
- Render HTML when URL ends `.html`, Markdown when `.md`.
- Menu JSON from `/menu`, sidebar JSON from `/sidebar` (define structures).
- Resolve smart-contract-provided asset URLs (`/style.css`, `/logo.png`, etc.) dynamically.
- Integrate Quilt file lookups and search metadata/indexes stored on Walrus.

## Frontend (Backoffice)
- Edit mode with rich editor; show Save only if user has rights.
- Saving uploads to Walrus, then submits contract txn referencing new blob.
- Allow editing any registered resource (HTML, metadata JSON, redirects).
- Enable new page creation (Walrus deploy + contract registration).
- Provide admin panel for assigning users/groups to pages; moderators of `/x` manage `/x/*`.

## CLI & Indexing Tools
- Bun CLI helpers to:
  - Deploy new frontends to Walrus.
  - Assign domain/NS records for Walrus sites.
  - Auto-renew content: scan pages, batch renew transactions.
- Indexing utility to:
  - Crawl all pages, build compact index, deploy to Walrus.
  - Research smart compression schemes.

## Additional Notes
- Pages/Subpages are SUI objects (NFT-like) owning subpages and pointing to Walrus blobs.
- Global registry shared object: map of page IDs for discovery and search.
- Content formats: Markdown/HTML, with diffs for history.
- Goal: build repo, smart contracts, frontend, Walrus integration, and win the hackathon.
