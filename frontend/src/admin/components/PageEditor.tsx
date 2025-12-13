import { Alert, Badge, Button, Input, Textarea } from "@fluffylabs/shared-ui";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { usePress3 } from "../../providers/Press3Provider";
import { getFile } from "../../services/walrus";
import { fetchPageById } from "../services/pages";
import { SaveStep, savePageContent } from "../services/save";
import type { Page } from "../types/page";
import { AdminLayout } from "./AdminLayout";

export function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const { packageId, press3ObjectId, getPageWithIndex } = usePress3();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { canEditPage } = usePermissions();

  const [page, setPage] = useState<Page | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveStep, setSaveStep] = useState<SaveStep | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
            setOriginalContent(walrusContent || "");
          } catch (error) {
            console.error("Failed to fetch content from Walrus:", error);
            setContent("");
            setOriginalContent("");
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

  // Track content changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const handleSave = async () => {
    if (!page) return;

    // Check wallet connection
    if (!currentAccount) {
      alert("Please connect your wallet first");
      return;
    }

    // Check permissions
    if (!canEditPage(page.path)) {
      alert(
        "You don't have permission to edit this page. Please connect the right account.",
      );
      return;
    }

    // Check for Press3 object
    if (!press3ObjectId) {
      alert("Press3 object not found");
      return;
    }

    // Get page data with index
    const pageData = getPageWithIndex(page.path);
    if (!pageData) {
      alert("Page not found in contract state");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    setSaveStep(null);

    try {
      const result = await savePageContent({
        packageId,
        press3ObjectId,
        pageIndex: pageData.index,
        pagePath: page.path,
        content,
        signAndExecute: async (tx) => {
          const result = await signAndExecuteTransaction({ transaction: tx });
          return { digest: result.digest };
        },
        onProgress: (step) => {
          setSaveStep(step);
        },
      });

      if (result.success) {
        setSaveSuccess(true);
        setOriginalContent(content); // Update original to match new saved content
        setTimeout(() => {
          setSaveSuccess(false);
          setSaveStep(null);
        }, 3000);
      } else {
        setSaveError(result.error?.message || "Failed to save page");
      }
    } catch (error) {
      console.error("Failed to save page:", error);
      setSaveError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading page...</p>
      </AdminLayout>
    );
  }

  if (!page) {
    return (
      <AdminLayout>
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-5 cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <Alert>Page not found</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-5"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {saveSuccess && <Alert className="mb-5">Page saved successfully!</Alert>}
      {saveError && <Alert className="mb-5">Error: {saveError}</Alert>}
      {saveStep && !saveSuccess && (
        <Alert className="mb-5">
          {saveStep === SaveStep.UPLOADING_WALRUS && "Uploading to Walrus..."}
          {saveStep === SaveStep.WAITING_WALLET &&
            "Waiting for wallet approval..."}
          {saveStep === SaveStep.SUBMITTING_TX && "Submitting transaction..."}
        </Alert>
      )}

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
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges || !currentAccount}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/admin")}>
          Cancel
        </Button>
      </div>
      {!currentAccount && (
        <p className="text-sm text-gray-500 mt-2">
          Connect your wallet to save changes
        </p>
      )}
      {currentAccount && !canEditPage(page.path) && (
        <p className="text-sm text-gray-500 mt-2">
          You don't have permission to edit this page
        </p>
      )}
    </AdminLayout>
  );
}
