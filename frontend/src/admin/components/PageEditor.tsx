import {
  Alert,
  Badge,
  Button,
  Header,
  Input,
  Textarea,
} from "@fluffylabs/shared-ui";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchPageById, updatePage } from "../services/pages";
import type { Page } from "../types/page";

// Simple SVG logo as data URL
const LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`
  <svg width="120" height="32" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="24" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#3b82f6">
      Press3
    </text>
  </svg>
`)}`;

export function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [content, setContent] = useState("");
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!pageId) return;

    const loadPage = async () => {
      setLoading(true);
      try {
        const fetchedPage = await fetchPageById(pageId);
        if (fetchedPage) {
          setPage(fetchedPage);
          setContent(fetchedPage.content || "");
          setPath(fetchedPage.path);
        }
      } catch (error) {
        console.error("Failed to load page:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pageId]);

  const handleSave = async () => {
    if (!pageId) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updatePage(pageId, { content, path });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save page:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <p>Loading page...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div style={{ padding: "40px" }}>
        <Alert>Page not found</Alert>
        <Button
          onClick={() => navigate("/admin")}
          style={{ marginTop: "20px" }}
        >
          Back to Pages
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Header
        toolNameSrc={LOGO_SVG}
        ghRepoName="FluffyLabs/sui-press3"
        endSlot={
          <Button variant="secondary" onClick={() => navigate("/admin")}>
            Back to Pages
          </Button>
        }
      />
      <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "30px" }}>Edit Page</h1>

        {saveSuccess && (
          <Alert style={{ marginBottom: "20px" }}>
            Page saved successfully!
          </Alert>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="path"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Page Path
          </label>
          <Input
            id="path"
            value={path}
            disabled
            placeholder="/path/to/page.html"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label htmlFor="content" style={{ fontWeight: 500 }}>
              Content
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                Walrus ID:
              </span>
              <code
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  backgroundColor: "#f3f4f6",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {page.walrusId}
              </code>
            </div>
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="Enter page content..."
            style={{ fontFamily: "monospace", fontSize: "13px" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "12px" }}>Editors</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {page.editors.map((editor) => (
              <Badge key={editor} title={editor}>
                {editor.slice(0, 6)}...{editor.slice(-4)}
              </Badge>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "12px" }}>Metadata</h3>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              display: "grid",
              gap: "8px",
            }}
          >
            <div>
              <strong>Registered at Block:</strong> #
              {page.registeredAtBlock.toLocaleString()}
            </div>
            <div>
              <strong>Updated at Block:</strong> #
              {page.updatedAtBlock.toLocaleString()}
              {page.updatedAtBlock !== page.registeredAtBlock && (
                <span style={{ color: "#16a34a", marginLeft: "8px" }}>
                  (Modified)
                </span>
              )}
            </div>
            {page.previousWalrusId && (
              <div>
                <strong>Previous Blob ID:</strong>{" "}
                <code
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                  title={page.previousWalrusId}
                >
                  {page.previousWalrusId}
                </code>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/admin")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
