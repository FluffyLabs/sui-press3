# Press3 Frontend

Vite + React scaffold that will evolve into the public/backoffice renderer for Press3. The current UI visualizes how smart-contract events, Walrus blobs, and metadata feeds will flow through the app.

## Quick start

```bash
npm install
npm run dev
```

## How this shell helps

- **Event stream mock** – `PAGE_EVENTS` inside `src/App.tsx` mirrors the data emitted by the Move contract. Swap this out for a SUI RPC or indexer subscription.
- **Renderer preview** – The "Walrus blob" card hints at where the actual HTML/Markdown rendering hooks go once the blob is pulled from Walrus.
- **Menu + sidebar schema** – `MENU_SCHEMA` shows the JSON structure expected from `/menu` and `/sidebar`, making it easy to align with backoffice tooling.
- **Dynamic assets** – The asset bindings table demonstrates how paths like `/style.css` can be resolved through smart-contract lookups instead of bundling.

## Next steps

1. Connect to SUI using the wallet kit of your choice and hydrate the mock data with real events.
2. Add Walrus fetch helpers (with quilt support) and hydrate the preview card with live content.
3. Split the UI into public renderer vs. backoffice editor routes once auth/permissions are wired in.
4. Share JSON schemas with the Bun CLI + Move contract so both sides stay in sync.
