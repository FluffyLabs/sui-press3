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

### Smart Contract (`contract/sources/contract.move`)
**Status**: Core functionality implemented ✅
- Tracks `page -> walrus blob id` mapping in Press3 shared object
- Access rights (admins and per-page editors)
- Events for initialization, registration, and updates
- **TODO**: Edit queues, nested permissions, page funding

### Content Display Frontend (`frontend/src/`)
**Status**: Fully functional public renderer ✅
- Resolves pages from contract, fetches Walrus blobs
- Renders HTML, Markdown, JSON, Images, Raw content
- Layout system (CMS, Wiki)
- Menu and sidebar support
- **TODO**: Dynamic asset resolution, quilt paths, search integration

### Backoffice Frontend (`frontend/src/admin/`)
**Status**: Core features implemented ✅
- Page creation and editing interfaces
- Wallet integration and permission checks
- Multi-step Walrus upload workflows
- Pages table and metadata display
- **TODO**: Rich text editor, media uploads, user/group management UI

### CLI Tooling (`cli/src/`)
**Status**: Core commands working ✅
- Contract deployment (SDK and CLI modes)
- Frontend deployment to Walrus
- Page management (create, update, promote)
- Batch operations for directories
- **TODO**: Domain assignment, auto-renewal, search indexing

### Search Indexer
**Status**: Not yet implemented 🚧
- **TODO**: Scan Walrus blobs, build compressed index, deploy to Walrus

## Smart Contract Status

### ✅ Implemented
- ✅ Init contract with admin role and shared Press3 object
- ✅ Register new pages (restricted to admin)
- ✅ Update page Walrus blob IDs (admin and editors can update)
- ✅ Set/manage editors per page (admin only)
- ✅ Set/manage admin list (admin only)
- ✅ Events emitted for initialization, page registration, and updates
- ✅ Permission checks (admin vs editor access)

### 🚧 TODO
- Edit queues for proposed changes workflow
- Nested permissions (parent page editors can manage subpages)
- Multisig-style group permissions
- Walrus quilt references for multi-file content
- On-chain redirect rules (e.g., `/ -> /index.html`)
- Page funding and sponsored transactions

## Frontend (Public Renderer)

### ✅ Implemented
- ✅ Connect to contract and fetch page data from Press3 shared object
- ✅ Fetch Walrus content for each page
- ✅ Render content based on type: HTML, Markdown, JSON, Images, Raw
- ✅ Layout system with CMS and Wiki templates
- ✅ Menu and sidebar support (when configured in layout)
- ✅ Dynamic routing (catch-all `/*` route renders pages from contract)
- ✅ 404 handling for missing pages
- ✅ Multi-stage loading indicators

### 🚧 TODO
- Resolve smart-contract-provided asset URLs dynamically
- Walrus Quilt file lookups for multi-file content
- Search metadata/indexes integration
- Client-side caching strategy

## Frontend (Backoffice)

### ✅ Implemented
- ✅ Admin panel with pages table displaying all pages from contract
- ✅ Page creation interface with multi-step workflow (Register → Certify → Update)
- ✅ Page editor with content textarea
- ✅ Wallet integration for authentication
- ✅ Permission checks (show/hide features based on admin/editor status)
- ✅ Multi-step save workflow with progress modal
- ✅ Upload to Walrus → Submit contract transaction workflow
- ✅ Error handling with user-friendly messages
- ✅ View page metadata (path, Walrus ID, editors)

### 🚧 TODO
- Rich text editor (WYSIWYG) for content creation
- Media upload interface
- Admin panel for assigning users/groups to pages
- Edit any resource type (metadata JSON, redirects, etc.)
- Nested page moderator management (`/x` editors manage `/x/*`)

## CLI & Indexing Tools

### ✅ Implemented
- ✅ **init**: Complete initialization (build contract, deploy frontend, register homepage)
- ✅ **contract**: Build and publish Move contract to SUI (SDK and CLI modes)
- ✅ **deploy**: Deploy frontend to Walrus
- ✅ **publish**: Upload single file to Walrus
- ✅ **retrieve**: Download blob from Walrus
- ✅ **update**: Update existing page or register new one with Walrus blob ID
- ✅ **promote**: Add/remove editors to/from pages
- ✅ **batch-publish-update**: Upload directory and update/register all pages in one transaction

### 🚧 TODO
- **assign-domain**: Assign domain/NS records for Walrus sites
- **renew**: Auto-renew content (scan pages, batch renew transactions)
- **index**: Indexing utility to crawl pages, build compact index, deploy to Walrus

## Implementation Details

### Current Architecture
- **Pages**: Stored as `PageRecord` structs in a vector within Press3 shared object
- **Access Control**: Admins (global) and Editors (per-page)
- **Content Storage**: Walrus blob IDs referenced from contract
- **Frontend**: React SPA with public renderer and admin panel
- **CLI**: Bun-based tooling for deployment and management

### Data Flow
1. **Page Creation**: Admin creates page → Upload to Walrus → Register in contract
2. **Page Update**: Admin/Editor edits → Upload new version to Walrus → Update contract reference
3. **Public View**: User requests page → Fetch from contract → Retrieve from Walrus → Render
4. **Editor Management**: Admin promotes/demotes editors → Contract updates editors list

### Key Design Decisions
- Pages stored in vector (not as separate objects) for simpler querying
- Editors list per page (not group-based yet)
- Multi-step Walrus upload (register + certify) with progress tracking
- Layout configuration via special pages (e.g., `/_layout.json`)
- Content type detection by file extension and MIME type
