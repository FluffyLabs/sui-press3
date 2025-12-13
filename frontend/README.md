# Press3 Frontend

The Press3 frontend is a Vite + React application that serves as both the **public content renderer** and **admin backoffice editor** for the decentralized CMS. It connects to SUI smart contracts and fetches content from Walrus storage.

> **Note**: See the [top-level README](../README.md) for project overview and [AGENTS.md](../AGENTS.md) for full requirements.

## Architecture

The frontend consists of three main routes:

### Routes

- **`/`** - Empty home page (placeholder for future public renderer)
- **`/dev`** - Development sandbox showing Walrus integration and page rendering prototypes
- **`/admin`** - Admin panel for managing pages (fully implemented)
  - `/admin/edit/:pageId` - Page editor interface

### Directory Structure

```
frontend/
├── src/
│   ├── admin/                    # Isolated admin panel (uses @fluffylabs/shared-ui)
│   │   ├── Admin.tsx            # Main admin dashboard with pages table
│   │   ├── components/          # Admin-specific components
│   │   │   ├── PageEditor.tsx   # Page editing interface
│   │   │   └── PagesTable.tsx   # Table displaying all pages
│   │   ├── services/            # Admin data services
│   │   │   └── pages.ts         # Mock SUI contract data (to be replaced)
│   │   └── types/               # Admin type definitions
│   │       └── page.ts          # Page data structure matching SUI contract
│   ├── components/              # Shared components
│   │   ├── HtmlRenderer.tsx     # HTML content renderer
│   │   ├── JsonRenderer.tsx     # JSON content renderer
│   │   ├── MarkdownRenderer.tsx # Markdown content renderer
│   │   └── Menu.tsx            # Navigation menu component
│   ├── services/
│   │   └── walrus.ts           # Walrus storage integration
│   ├── App.tsx                 # Main routing configuration
│   ├── Dev.tsx                 # Development sandbox component
│   └── Home.tsx                # Home page component
├── public/                     # Static assets
└── package.json               # Dependencies and scripts
```

## Data Model

The frontend works with the following data structure from the SUI smart contract:

```typescript
export type Page = {
  id: string;                    // Internal UI routing ID
  path: string;                  // From PageRecord.path
  walrusId: string;              // From PageRecord.walrus_id (current blob)
  editors: string[];             // From PageRecord.editors (vector<address>)
  registeredAtBlock: number;     // Block when page was first registered
  updatedAtBlock: number;        // Block when page was last updated
  previousWalrusId: string | null; // Previous walrus blob id
  content?: string;              // Fetched content (not from contract)
};
```

This matches the SUI smart contract `PageRecord` structure:

```move
public struct PageRecord has store {
    path: String,
    walrus_id: String,
    editors: vector<address>,
}
```

## Quick Start

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Available Routes

- `http://localhost:5173/` - Home page (empty)
- `http://localhost:5173/dev` - Development sandbox with mock data
- `http://localhost:5173/admin` - Admin panel with pages table
- `http://localhost:5173/admin/edit/1` - Edit page with ID "1"

### Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Linting & Quality

```bash
# Run biome linter/formatter
npm run qa

# Auto-fix issues
npm run qa-fix
```

## Key Features

### Admin Panel (`/admin`)

The admin panel provides a complete interface for managing pages:

**Pages Table**:
- Displays all pages from the SUI contract
- Columns: Page Path, Registered Block, Updated Block, Editors, Previous Blob
- Click any page path to edit
- Shows statistics: total pages and total editors

**Page Editor** (`/admin/edit/:pageId`):
- Edit page path and content
- View all editors (SUI addresses)
- See metadata: registration block, update block, previous blob ID
- Save changes (currently mocked, will connect to SUI contract)
- Visual indicators for modified pages

**UI Components**:
- Uses [@fluffylabs/shared-ui](https://github.com/FluffyLabs/shared-ui) component library
- Includes Header, Button, Input, Textarea, Alert, Badge components
- Consistent design system with Tailwind CSS
- Dark mode support (via shared-ui)

### Dev Sandbox (`/dev`)

The development sandbox demonstrates:
- Walrus content fetching
- HTML, Markdown, and JSON rendering
- Menu navigation component
- Page event simulation
- Smart contract asset bindings

### Content Renderers

The frontend includes specialized renderers for different content types:

- **HtmlRenderer**: Renders HTML content with `dangerouslySetInnerHTML`
- **MarkdownRenderer**: Uses `react-markdown` for Markdown rendering
- **JsonRenderer**: Pretty-prints JSON with syntax highlighting

## Integration Points

### SUI Smart Contract (To Be Implemented)

The frontend currently uses mock data in `src/admin/services/pages.ts`. This needs to be replaced with:

1. **Connect to SUI RPC**: Use `@mysten/sui` to connect to the network
2. **Fetch Page Events**: Subscribe to or query page registration/update events
3. **Read PageRecords**: Query the contract for page data
4. **Write Updates**: Submit transactions to update pages
5. **Handle Permissions**: Check editor permissions before showing edit UI

Example integration points:
```typescript
// TODO: Replace mock with actual SUI queries
export async function fetchPages(): Promise<Page[]> {
  // Query contract for all pages
  // Parse PageRecord objects
  // Return formatted data
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<Page> {
  // Upload content to Walrus
  // Submit transaction to update PageRecord
  // Return updated page
}
```

### Walrus Storage

Current Walrus integration in `src/services/walrus.ts`:

```typescript
import { Walrus } from "@mysten/walrus";

// Fetch file from Walrus
export async function getFile(blobId: string): Promise<string>
```

**Next Steps**:
1. Upload content to Walrus when saving pages
2. Fetch and cache Walrus content efficiently
3. Handle Walrus quilt paths for multi-file blobs
4. Implement asset resolution (CSS, images) from contract-provided URLs

## Dependencies

### Core
- **React 19** - UI framework
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server

### SUI & Walrus
- **@mysten/sui** - SUI blockchain integration
- **@mysten/walrus** - Walrus storage client

### UI Components
- **@fluffylabs/shared-ui** - Shared UI component library
- **tailwind-merge** - Tailwind class merging utility
- **react-markdown** - Markdown rendering

### Development
- **TypeScript** - Type safety
- **@biomejs/biome** - Linter and formatter
- **ESLint** - Additional linting

## Environment Setup

The frontend doesn't currently use environment variables, but you may need to add:

```bash
# .env.local
VITE_SUI_NETWORK=testnet
VITE_SUI_PACKAGE_ID=0x...
VITE_WALRUS_AGGREGATOR=https://...
VITE_WALRUS_PUBLISHER=https://...
```

## Next Steps

### Immediate TODOs

1. **Replace Mock Data**:
   - Connect to actual SUI smart contract
   - Fetch real page events and data
   - Implement transaction submission

2. **Walrus Integration**:
   - Upload editor content to Walrus
   - Fetch content for rendering
   - Handle quilt paths and asset resolution

3. **Public Renderer** (`/`):
   - Implement page routing based on contract data
   - Render HTML/Markdown content from Walrus
   - Add menu/sidebar navigation
   - Support asset injection (CSS, images)

4. **Authentication**:
   - Integrate zkLogin for editor authentication
   - Show/hide edit UI based on permissions
   - Handle sponsored transactions

5. **Edit Queue**:
   - Implement proposed changes workflow
   - Show pending edits
   - Approval/rejection interface

### Future Enhancements

- Search integration with Walrus-hosted index
- Rich text editor for content creation
- Media upload interface
- Version history viewer (previous blobs)
- Real-time collaboration
- Comment system
- Page templates and layouts

## Testing

Currently using development testing. To add proper tests:

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

## Deployment

The frontend will be deployed to Walrus storage. Build process:

```bash
# Build for production
npm run build

# Deploy to Walrus (via CLI tool - see ../cli/README.md)
cd ../cli
bun run deploy:frontend
```

## Contributing

When working on the frontend:

1. **Isolation**: Keep admin panel isolated in `src/admin/`
2. **Type Safety**: Update types in `src/admin/types/` to match contract changes
3. **Mock Data**: Update `src/admin/services/pages.ts` when contract schema changes
4. **UI Components**: Use `@fluffylabs/shared-ui` for admin UI consistency
5. **Code Quality**: Run `npm run qa-fix` before committing

## Troubleshooting

### Build Issues

If you encounter TypeScript errors:
```bash
npm run build
```

Check console for specific errors and verify type definitions match contract schema.

### Import Errors

If shared-ui components fail to import:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Walrus Connection Issues

Check that Walrus aggregator/publisher endpoints are accessible. Test with:
```bash
curl -I https://aggregator.walrus-testnet.walrus.space/
```

## Resources

- [SUI Documentation](https://docs.sui.io/)
- [Walrus Documentation](https://docs.walrus.site/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [@fluffylabs/shared-ui Storybook](https://fluffylabs.dev/shared-ui/)
