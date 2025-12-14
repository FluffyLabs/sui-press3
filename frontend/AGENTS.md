# AI Agent Instructions - Press3 Frontend

This document provides guidance for AI agents working on the Press3 frontend codebase.

> **Important**: Read the [top-level AGENTS.md](../AGENTS.md) first for project-wide context and requirements.

## Project Context

Press3 is a decentralized CMS built on SUI with Walrus storage. The frontend serves dual purposes:
1. **Public Renderer**: Displays pages from Walrus storage based on SUI contract data
2. **Admin Backoffice**: Allows authorized editors to manage content

## Current State

### ✅ Implemented
- React + Vite + TypeScript setup
- React Router with public renderer and admin routes
- **Full SUI smart contract integration** via `@mysten/sui` SDK
- **Sui wallet integration** for authentication and transactions
- Admin panel with pages table, page creation, and page editor
- **Public renderer** with multi-layout support (CMS, Wiki)
- Integration with @fluffylabs/shared-ui component library
- **Content renderers** for HTML, Markdown, JSON, Images, and Raw content
- **Full Walrus storage integration** (upload and download)
- **Multi-step workflows** for page creation and updates with progress indicators
- Layout system with customizable templates (CMS, Wiki)
- Context providers for Press3 contract data, wallet, and layout management
- Error handling with user-friendly messages

### 🚧 In Progress / TODO
- zkLogin for gasless editor authentication
- Edit queue workflow for proposed changes
- Rich text editor for content creation
- Version history viewer (displaying previous Walrus blobs)
- Search integration with Walrus-hosted index
- Comment system
- Walrus quilt paths for multi-file content

## Architecture Guidelines

### Directory Structure

**IMPORTANT**: The admin panel is **isolated** in `src/admin/`:
```
src/
├── admin/                        # ⚠️ Admin panel - isolated module
│   ├── Admin.tsx                # Main admin dashboard
│   ├── components/              # Admin UI components
│   │   ├── AdminLayout.tsx      # Admin layout wrapper
│   │   ├── PageCreate.tsx       # Page creation interface
│   │   ├── PageEditor.tsx       # Page editing interface
│   │   ├── PagesTable.tsx       # Pages table component
│   │   ├── SaveProgressModal.tsx # Multi-step save progress
│   │   └── WalletConnectButton.tsx # Wallet connection
│   ├── services/                # Admin business logic
│   │   ├── create.ts            # Page creation workflow
│   │   └── save.ts              # Page update workflow
│   └── types/                   # Admin type definitions
│       └── page.ts              # Page data structure
├── components/                  # Shared components (renderers, layouts)
│   ├── *Renderer.tsx            # Content type renderers
│   ├── *Layout.tsx              # Layout templates
│   └── ...
├── hooks/                       # React hooks
│   └── useWalrusContent.ts
├── providers/                   # React context providers
│   ├── LayoutProvider.tsx       # Layout and page data
│   ├── Press3Provider.tsx       # Contract data
│   └── WalletProvider.tsx       # Wallet connection
├── services/                    # Shared services
│   ├── contract.ts              # Transaction builders
│   ├── press3.ts                # Contract queries
│   ├── walrus.ts                # Walrus integration
│   └── enrichedPages.ts         # Data enrichment
└── *.tsx                        # Route components (App, Page, Dev)
```

**Rules**:
1. Admin-specific code MUST stay in `src/admin/`
2. Admin panel imports from `@fluffylabs/shared-ui` only (no other UI libraries)
3. Shared components go in `src/components/`
4. Contract integration goes in `src/services/`
5. Don't mix admin and public renderer code
6. Use context providers for cross-cutting concerns

### Data Model

The frontend data model MUST match the SUI smart contract:

```typescript
// src/admin/types/page.ts
export type Page = {
  id: string;                    // Internal UI ID (not from contract)
  path: string;                  // PageRecord.path
  walrusId: string;              // PageRecord.walrus_id (current)
  editors: string[];             // PageRecord.editors (SUI addresses)
  registeredAtBlock: number;     // Registration block number
  updatedAtBlock: number;        // Last update block number
  previousWalrusId: string | null; // Previous blob version
  content?: string;              // Fetched from Walrus (not contract)
};
```

**Contract Schema** (from `contract/sources/press3.move`):
```move
public struct PageRecord has store {
    path: String,
    walrus_id: String,
    editors: vector<address>,
}
```

### Integration Points

#### SUI Contract Integration ✅
Location: `src/services/press3.ts` and `src/services/contract.ts`

**Fully implemented**:
1. ✅ Uses `@mysten/sui` package
2. ✅ Connects to testnet/mainnet RPC via `SuiClient`
3. ✅ Queries Press3 shared object for all PageRecord objects
4. ✅ Parses and transforms PageRecord data to frontend types
5. ✅ Submits transactions for page updates and registration
6. ✅ Transaction builders in `src/services/contract.ts`

**Key Functions**:
```typescript
// src/services/press3.ts
export async function fetchPress3Pages(
  client: SuiClient,
  packageId: string,
  objectId: string
): Promise<Page[]>

// src/services/contract.ts
export function buildUpdatePageTransaction(...)
export function buildRegisterPageTransaction(...)
```

**Context Provider**:
- `src/providers/Press3Provider.tsx` - Provides contract data to entire app
- Automatically refreshes on wallet connection

#### Walrus Storage Integration ✅
Location: `src/services/walrus.ts`

**Fully implemented**:
1. ✅ Uses `@mysten/walrus` package
2. ✅ Implements multi-step upload workflow (register + certify)
3. ✅ Downloads and caches content
4. ✅ Blob existence checking
5. ✅ Error handling with user-friendly messages

**Key Functions**:
```typescript
// Upload with multi-step workflow
export async function uploadContent(
  content: string,
  path: string,
  owner: string,
  epochs: number,
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>,
  onCertifying: () => void
): Promise<{ blobId: string; registerDigest: string; certifyDigest: string }>

// Download content
export async function getFile(blobId: string): Promise<Uint8Array>

// Check blob existence
export async function checkBlobExists(blobId: string): Promise<boolean>
```

**Usage**:
- Used in `src/admin/services/create.ts` for page creation
- Used in `src/admin/services/save.ts` for page updates
- Integrated with multi-step progress modals

## Development Workflow

### Making Changes

1. **Read First**: Always read files before editing (required by Write tool)
2. **Type Safety**: Update `src/admin/types/page.ts` if contract schema changes
3. **Mock Data**: Update `src/admin/services/pages.ts` mock data to match types
4. **Test Build**: Run `npm run build` before committing
5. **Quality Check**: Run `npm run qa-fix` to auto-fix linting issues

### Adding New Features

#### For Admin Panel Features:
1. Create components in `src/admin/components/`
2. Use `@fluffylabs/shared-ui` components only
3. Update `src/admin/Admin.tsx` or `src/admin/components/PageEditor.tsx`
4. Keep admin routing under `/admin/*`

#### For Public Renderer Features:
1. Create components in `src/components/` if shared
2. Implement routing in `App.tsx` under `/` or other public routes
3. Don't use admin-specific components
4. Can use any UI library (not restricted to shared-ui)

### Common Tasks

#### Task: Update Page Schema
1. Modify `src/admin/types/page.ts`
2. Update mock data in `src/admin/services/pages.ts`
3. Update table columns in `src/admin/components/PagesTable.tsx`
4. Update editor display in `src/admin/components/PageEditor.tsx`
5. Run `npm run build` to verify types

#### Task: Add New Admin Component
1. Create file in `src/admin/components/NewComponent.tsx`
2. Import from `@fluffylabs/shared-ui` for UI elements
3. Use the admin types from `../types/page`
4. Export component
5. Import in `Admin.tsx` or `PageEditor.tsx`

#### Task: Add New Feature
1. **Frontend feature**: Create component in appropriate location
   - Admin features → `src/admin/components/`
   - Public features → `src/components/`
   - Shared services → `src/services/`
2. **Contract integration**: Use existing services
   - Query data via `src/services/press3.ts`
   - Build transactions via `src/services/contract.ts`
   - Access data via `Press3Provider` context
3. **Walrus integration**: Use existing walrus service
   - Upload via `uploadContent()` in `src/services/walrus.ts`
   - Download via `getFile()` or `useWalrusContent()` hook
4. Handle errors and loading states
5. Test with testnet contract

## Important Constraints

### UI Component Library
- **Admin panel**: ONLY use `@fluffylabs/shared-ui`
- **Public renderer**: Any UI library allowed
- **Shared components**: Keep framework-agnostic

### Styling
- Admin panel uses shared-ui theme (imported in `Admin.tsx`)
- Uses inline styles for layout (no additional CSS files)
- Public renderer can use any styling approach

### Data Flow
```
SUI Contract → Services → Types → Components → UI
     ↓
Walrus Storage → Content Renderers
```

### Performance
- Lazy load routes if bundle grows
- Cache Walrus content when appropriate
- Debounce editor saves
- Use React.memo for expensive components

## Testing Guidelines

Currently no tests implemented. When adding:

1. **Unit Tests**: Test utilities and services
2. **Component Tests**: Test UI components in isolation
3. **Integration Tests**: Test admin workflows end-to-end
4. **E2E Tests**: Test public renderer with real contract

```bash
# Future setup
npm install --save-dev vitest @testing-library/react
npm test
```

## Debugging

### Common Issues

**TypeScript Errors**:
- Check types match contract schema
- Verify imports are correct
- Run `npm run build` to see all errors

**Runtime Errors**:
- Check browser console
- Verify mock data structure
- Check route configuration in `App.tsx`

**Styling Issues**:
- Verify `@fluffylabs/shared-ui` CSS is imported
- Check component props match shared-ui API
- View Storybook: https://fluffylabs.dev/shared-ui/

**Build Errors**:
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

## Code Style

### Naming Conventions
- Components: PascalCase (`PageEditor.tsx`)
- Utilities: camelCase (`formatAddress()`)
- Types: PascalCase (`Page`, `PageRecord`)
- Constants: UPPER_SNAKE_CASE (`MOCK_PAGES`)

### File Organization
```typescript
// Imports (grouped)
import { useState } from "react";
import { Button } from "@fluffylabs/shared-ui";
import type { Page } from "../types/page";

// Types/Interfaces
interface Props { }

// Constants
const DEFAULT_VALUE = "";

// Component
export function MyComponent() {
  // State
  // Effects
  // Handlers
  // Render
}
```

### Comments
- Use JSDoc for exported functions
- Comment complex logic only
- Reference contract code when relevant
- Mark TODOs clearly: `// TODO: Connect to SUI contract`

## Environment Variables

Add to `.env.local` (not committed):
```bash
VITE_SUI_NETWORK=https://fullnode.testnet.sui.io
VITE_SUI_PACKAGE_ID=0x...
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
```

Access in code:
```typescript
const network = import.meta.env.VITE_SUI_NETWORK;
```

## Deployment

Frontend will be deployed to Walrus. Build command:
```bash
npm run build
# Output: dist/
```

Deploy via CLI tool (see `../cli/README.md`).

## Resources

### Documentation
- [SUI SDK](https://sdk.mystenlabs.com/typescript)
- [Walrus Docs](https://docs.walrus.site/)
- [shared-ui Storybook](https://fluffylabs.dev/shared-ui/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)

### Code References
- Contract: `../contract/sources/press3.move`
- CLI: `../cli/`
- Top-level requirements: `../AGENTS.md`

## Quick Reference

### File Locations
| Feature | File Path |
|---------|-----------|
| Page type | `src/admin/types/page.ts` |
| Mock data | `src/admin/services/pages.ts` |
| Pages table | `src/admin/components/PagesTable.tsx` |
| Page editor | `src/admin/components/PageEditor.tsx` |
| Admin main | `src/admin/Admin.tsx` |
| Routing | `src/App.tsx` |
| Walrus service | `src/services/walrus.ts` |

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run qa           # Lint
npm run qa-fix       # Auto-fix lint issues
```

### Important Reminders

1. ⚠️ **ALWAYS** keep admin code in `src/admin/`
2. ⚠️ **ALWAYS** match contract schema in types
3. ⚠️ **ALWAYS** read files before editing
4. ⚠️ **ALWAYS** run build before committing
5. ⚠️ **ALWAYS** reference top-level `AGENTS.md` for requirements

## Getting Help

If stuck:
1. Check this document
2. Read `../AGENTS.md` for requirements
3. Review contract code in `../contract/`
4. Check shared-ui Storybook for component API
5. Search SUI/Walrus documentation
