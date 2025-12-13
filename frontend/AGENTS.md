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
- React Router with three main routes (`/`, `/dev`, `/admin`)
- Admin panel with pages table and editor interface
- Integration with @fluffylabs/shared-ui component library
- Content renderers for HTML, Markdown, and JSON
- Mock data matching SUI contract schema
- Walrus integration stub (`src/services/walrus.ts`)

### 🚧 In Progress / TODO
- Connect to actual SUI smart contract (replace mock data)
- Implement Walrus content upload/download
- Add zkLogin authentication
- Build public renderer on `/` route
- Implement edit queue workflow
- Add permission checks

## Architecture Guidelines

### Directory Structure

**IMPORTANT**: The admin panel is **isolated** in `src/admin/`:
```
src/
├── admin/              # ⚠️ Admin panel - isolated module
│   ├── Admin.tsx
│   ├── components/
│   ├── services/
│   └── types/
├── components/         # Shared components (renderers, menu)
├── services/          # Shared services (walrus)
└── *.tsx              # Route components (App, Home, Dev)
```

**Rules**:
1. Admin-specific code MUST stay in `src/admin/`
2. Admin panel imports from `@fluffylabs/shared-ui` only (no other UI libraries)
3. Shared components go in `src/components/`
4. Don't mix admin and public renderer code

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

#### SUI Contract Integration
Location: `src/admin/services/pages.ts`

Currently contains mock data. When implementing:
1. Use `@mysten/sui` package (already installed)
2. Connect to testnet/mainnet RPC
3. Query for PageRecord objects
4. Subscribe to page creation/update events
5. Submit transactions for page updates

Example:
```typescript
import { SuiClient } from '@mysten/sui';

const client = new SuiClient({
  url: import.meta.env.VITE_SUI_NETWORK
});

export async function fetchPages(): Promise<Page[]> {
  // Query contract for all PageRecord objects
  // Transform to frontend Page type
  // Return data
}
```

#### Walrus Storage Integration
Location: `src/services/walrus.ts`

Currently has basic `getFile` function. When implementing:
1. Use `@mysten/walrus` package (already installed)
2. Implement upload for content saves
3. Handle quilt paths for multi-file content
4. Cache fetched content
5. Resolve asset URLs from contract

Example:
```typescript
import { Walrus } from '@mysten/walrus';

export async function uploadContent(content: string): Promise<string> {
  // Upload to Walrus
  // Return blob ID
}

export async function getFile(blobId: string): Promise<string> {
  // Fetch from Walrus
  // Cache if appropriate
  // Return content
}
```

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

#### Task: Integrate SUI Contract
1. Read contract code in `../contract/sources/press3.move`
2. Understand data structures and functions
3. Update `src/admin/services/pages.ts`:
   - Replace `fetchPages()` with SUI query
   - Replace `updatePage()` with transaction submission
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
