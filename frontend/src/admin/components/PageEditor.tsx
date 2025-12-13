import { Alert, Badge, Button, Input, Textarea } from "@fluffylabs/shared-ui";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePress3 } from "../../providers/Press3Provider";
import { getFile } from "../../services/walrus";
import { fetchPageById, updatePage } from "../services/pages";
import type { Page } from "../types/page";
import { AdminLayout } from "./AdminLayout";

export function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const { packageId } = usePress3();
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
        const fetchedPage = await fetchPageById(packageId, pageId);
        if (fetchedPage) {
          setPage(fetchedPage);
          setPath(fetchedPage.path);

          // Fetch content from Walrus
          try {
            const walrusContent = await getFile(fetchedPage.walrusId);
            setContent(walrusContent || "");
          } catch (error) {
            console.error("Failed to fetch content from Walrus:", error);
            setContent("");
          }
        }
      } catch (error) {
        console.error("Failed to load page:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pageId, packageId]);

  const handleSave = async () => {
    if (!pageId) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updatePage(packageId, pageId, { path });
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
      <AdminLayout
        headerEndSlot={
          <Button variant="secondary" onClick={() => navigate("/admin")}>
            Back to Pages
          </Button>
        }
      >
        <p>Loading page...</p>
      </AdminLayout>
    );
  }

  if (!page) {
    return (
      <AdminLayout
        headerEndSlot={
          <Button variant="secondary" onClick={() => navigate("/admin")}>
            Back to Pages
          </Button>
        }
      >
        <Alert>Page not found</Alert>
        <Button onClick={() => navigate("/admin")} className="mt-5">
          Back to Pages
        </Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      headerEndSlot={
        <Button variant="secondary" onClick={() => navigate("/admin")}>
          Back to Pages
        </Button>
      }
    >
      {saveSuccess && <Alert className="mb-5">Page saved successfully!</Alert>}

      <div className="mb-5">
        <label htmlFor="path" className="block mb-2 font-medium">
          Page Path
        </label>
        <Input
          id="path"
          value={path}
          disabled
          placeholder="/path/to/page.html"
        />
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="content" className="font-medium">
            Content
          </label>
          <div className="flex gap-2">
            <span className="text-xs text-gray-500">Walrus ID:</span>
            <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
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
          className="font-mono text-[13px]"
        />
      </div>

      <div className="mb-5">
        <h3 className="mb-3">Editors</h3>
        <div className="flex gap-2 flex-wrap">
          {page.editors.map((editor) => (
            <Badge key={editor} title={editor}>
              {editor.slice(0, 6)}...{editor.slice(-4)}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/admin")}>
          Cancel
        </Button>
      </div>
    </AdminLayout>
  );
}
