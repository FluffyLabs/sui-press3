import "@fluffylabs/shared-ui/theme.css";
import "@fluffylabs/shared-ui/style.css";
import { useEffect, useState } from "react";
import { Button, Alert, Badge, Header } from "@fluffylabs/shared-ui";
import { PagesTable } from "./components/PagesTable";
import { fetchPages } from "./services/pages";
import type { Page } from "./types/page";

// Simple SVG logo as data URL
const LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`
  <svg width="120" height="32" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="24" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#3b82f6">
      Press3
    </text>
  </svg>
`)}`;

function Admin() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPages = async () => {
      setLoading(true);
      try {
        const fetchedPages = await fetchPages();
        setPages(fetchedPages);
      } catch (error) {
        console.error("Failed to load pages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  return (
    <div>
      <Header
        toolNameSrc={LOGO_SVG}
        ghRepoName="FluffyLabs/sui-press3"
        endSlot={<Button>Create New Page</Button>}
      />
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>

      <Alert style={{ marginBottom: "30px" }}>
        <p>
          Manage your decentralized content. All pages are stored on Walrus and
          indexed via SUI smart contracts.
        </p>
      </Alert>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <Badge>{pages.length} Total Pages</Badge>
          <Badge>
            {pages.reduce((sum, p) => sum + p.editors.length, 0)} Total Editors
          </Badge>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          Loading pages...
        </div>
      ) : pages.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          No pages found. Create your first page to get started.
        </div>
      ) : (
        <PagesTable pages={pages} />
      )}
      </div>
    </div>
  );
}

export default Admin;
