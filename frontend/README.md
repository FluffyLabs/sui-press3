# Press3 Frontend

The Press3 frontend is a Vite + React application that serves as both the **public content renderer** and **admin backoffice editor** for the decentralized CMS. It connects to SUI smart contracts and fetches content from Walrus storage.

> **Note**: See the [top-level README](../README.md) for project overview and [AGENTS.md](../AGENTS.md) for full requirements.

## Architecture

The frontend is a full-featured CMS with public rendering and admin capabilities.

### Routes

- **`/*`** - Public renderer (catch-all route for rendering pages from contract)
- **`/dev`** - Development sandbox showing Walrus integration and page rendering prototypes
- **`/admin`** - Admin panel for managing pages
  - `/admin/create` - Page creation interface
  - `/admin/edit/:pageId` - Page editor interface

### Directory Structure

```
frontend/
├── src/
│   ├── admin/                       # Isolated admin panel (uses @fluffylabs/shared-ui)
│   │   ├── Admin.tsx               # Main admin dashboard with pages table
│   │   ├── components/             # Admin-specific components
│   │   │   ├── AdminLayout.tsx     # Admin panel layout wrapper
│   │   │   ├── PageCreate.tsx      # Page creation interface
│   │   │   ├── PageEditor.tsx      # Page editing interface
│   │   │   ├── PagesTable.tsx      # Table displaying all pages
│   │   │   ├── SaveProgressModal.tsx # Multi-step save progress modal
│   │   │   └── WalletConnectButton.tsx # Wallet connection button
│   │   ├── services/               # Admin data services
│   │   │   ├── create.ts           # Page creation workflow
│   │   │   └── save.ts             # Page save/update workflow
│   │   └── types/                  # Admin type definitions
│   │       └── page.ts             # Page data structure matching SUI contract
│   ├── components/                 # Shared components
│   │   ├── CmsLayout.tsx           # CMS layout template
│   │   ├── ContentRenderer.tsx     # Dynamic content renderer (routing by type)
│   │   ├── HtmlRenderer.tsx        # HTML content renderer
│   │   ├── ImgRenderer.tsx         # Image content renderer
│   │   ├── JsonRenderer.tsx        # JSON content renderer
│   │   ├── LayoutPage.tsx          # Layout page wrapper
│   │   ├── MarkdownRenderer.tsx    # Markdown content renderer
│   │   ├── Menu.tsx                # Navigation menu component
│   │   ├── MultiStageLoader.tsx    # Loading indicator with stages
│   │   ├── NotFoundPage.tsx        # 404 page component
│   │   ├── RawRenderer.tsx         # Raw text content renderer
│   │   ├── Sidebar.tsx             # Sidebar navigation component
│   │   └── WikiLayout.tsx          # Wiki layout template
│   ├── hooks/
│   │   └── useWalrusContent.ts     # Hook for fetching Walrus content
│   ├── providers/                  # Context providers
│   │   ├── LayoutProvider.tsx      # Layout and page data provider
│   │   ├── Press3Provider.tsx      # Press3 contract data provider
│   │   └── WalletProvider.tsx      # Sui wallet provider
│   ├── services/
│   │   ├── contract.ts             # SUI contract transaction builders
│   │   ├── enrichedPages.ts        # Page data enrichment
│   │   ├── press3.ts               # Press3 contract queries
│   │   └── walrus.ts               # Walrus storage integration
│   ├── App.tsx                     # Main routing configuration
│   ├── Dev.tsx                     # Development sandbox component
│   ├── Page.tsx                    # Public page renderer
│   └── main.tsx                    # Application entry point
├── public/                         # Static assets
└── package.json                    # Dependencies and scripts
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

- `http://localhost:5173/` - Public renderer (renders pages from contract)
- `http://localhost:5173/dev` - Development sandbox for testing
- `http://localhost:5173/admin` - Admin panel with pages table
- `http://localhost:5173/admin/create` - Create new page
- `http://localhost:5173/admin/edit/:pageId` - Edit existing page

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
- Displays all pages from the SUI contract (live data!)
- Columns: Page Path, Walrus ID, Editors
- Click any page path to edit
- Create new page button

**Page Creation** (`/admin/create`):
- Create new pages with custom path and content
- Upload content to Walrus
- Register page in smart contract
- Multi-step progress indicator (Register → Certify → Update → Success)
- Error handling with helpful messages

**Page Editor** (`/admin/edit/:pageId`):
- Edit existing page content
- Upload new version to Walrus
- Update contract with new Walrus blob ID
- View page metadata and editors
- Multi-step save progress modal
- Visual indicators for modified pages

**Wallet Integration**:
- Connect with Sui wallet
- Sign transactions for page updates
- Admin/editor permission checks

**UI Components**:
- Uses [@fluffylabs/shared-ui](https://github.com/FluffyLabs/shared-ui) component library
- Includes Header, Button, Input, Textarea, Alert, Badge, Modal components
- Consistent design system with Tailwind CSS

### Public Renderer (`/`)

The public renderer displays pages from the contract:
- Fetches page data from SUI smart contract
- Retrieves content from Walrus storage
- Supports multiple layout types (CMS, Wiki)
- Dynamic content rendering based on file extension
- Menu and sidebar support (when configured)
- 404 handling for missing pages

**Layout Types**:
- **CMS Layout**: Traditional CMS with menu and main content area
- **Wiki Layout**: Wiki-style layout with sidebar navigation
- **Raw**: Direct HTML rendering without layout wrapper

### Content Renderers

The frontend includes specialized renderers for different content types:

- **HtmlRenderer**: Renders HTML content with `dangerouslySetInnerHTML`
- **MarkdownRenderer**: Uses `react-markdown` for Markdown rendering
- **JsonRenderer**: Pretty-prints JSON with syntax highlighting
- **ImgRenderer**: Displays images with loading states and fallbacks
- **RawRenderer**: Renders raw text content

Content type is automatically determined by file extension or MIME type.

## Integration Points

### SUI Smart Contract Integration ✅

The frontend is **fully integrated** with the SUI smart contract:

**Implemented Features**:
1. **Connect to SUI RPC**: Using `@mysten/sui` SDK (`src/services/press3.ts`)
2. **Fetch Page Data**: Queries the Press3 shared object for all pages
3. **Read PageRecords**: Retrieves path, walrus_id, and editors for each page
4. **Write Updates**: Submits transactions to update pages (`src/services/contract.ts`)
5. **Handle Permissions**: Checks admin/editor permissions via wallet connection
6. **Create Pages**: Registers new pages with Walrus content (`src/admin/services/create.ts`)
7. **Multi-step Workflows**: Handles Walrus registration, certification, and contract updates

**Key Files**:
- `src/services/press3.ts` - Contract queries and data fetching
- `src/services/contract.ts` - Transaction builders for updates and registration
- `src/providers/Press3Provider.tsx` - React context for contract data
- `src/admin/services/create.ts` - Page creation workflow
- `src/admin/services/save.ts` - Page update workflow

### Walrus Storage Integration ✅

**Fully implemented** Walrus integration in `src/services/walrus.ts`:

```typescript
import { Walrus } from "@mysten/walrus";

// Upload content to Walrus (with multi-step workflow)
export async function uploadContent(
  content: string,
  path: string,
  owner: string,
  epochs: number,
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>,
  onCertifying: () => void
): Promise<{ blobId: string; registerDigest: string; certifyDigest: string }>;

// Fetch file from Walrus
export async function getFile(blobId: string): Promise<Uint8Array>;

// Check blob existence
export async function checkBlobExists(blobId: string): Promise<boolean>;
```

**Features**:
- ✅ Upload content with configurable epoch storage duration
- ✅ Multi-step workflow (register, certify)
- ✅ Download and cache content
- ✅ Blob existence checking
- ✅ Error handling and user-friendly messages

**Future Enhancements**:
- Walrus quilt paths for multi-file blobs
- Asset resolution (CSS, images) from contract-provided URLs

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

The frontend supports the following environment variables:

```bash
# .env.local
VITE_PRESS3_PACKAGE_ID=0x...     # Press3 contract package ID (optional, uses localStorage or hardcoded default)
VITE_PRESS3_OBJECT_ID=0x...      # Press3 shared object ID (optional, uses localStorage or hardcoded default)
```

**Note**: Package ID and Object ID are primarily configured via localStorage after running `bun run press3 init` from the CLI, which saves the configuration. The environment variables serve as fallbacks.

## Next Steps

### Immediate TODOs

1. **zkLogin Integration**:
   - Implement zkLogin for gasless editor authentication
   - Handle sponsored transactions for editors
   - Reduce friction for content contributors

2. **Rich Text Editor**:
   - Replace textarea with WYSIWYG editor
   - Support media uploads
   - Markdown editing mode

3. **Edit Queue**:
   - Implement proposed changes workflow
   - Show pending edits for review
   - Approval/rejection interface

4. **Asset Management**:
   - Handle Walrus quilt paths for multi-file content
   - Implement asset resolution (CSS, images, fonts)
   - Support referencing assets from contract metadata

5. **Search**:
   - Integrate with Walrus-hosted search index
   - Implement search UI
   - Support full-text search across pages

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
