import { Alert, Badge, Button, Input } from "@fluffylabs/shared-ui";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { usePress3 } from "../../providers/Press3Provider";
import { getFile } from "../../services/walrus";
import { fetchPageById } from "../services/pages";
import { type SaveStep, savePageContent } from "../services/save";
import type { Page } from "../types/page";
import { AdminLayout } from "./AdminLayout";
import { RichEditor } from "./RichEditor";
import { SaveProgressModal } from "./SaveProgressModal";

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
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveStep, setSaveStep] = useState<SaveStep | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [transactionDigests, setTransactionDigests] = useState<{
    register?: string;
    certify?: string;
    update?: string;
  } | null>(null);

  useEffect(() => {
    if (!pageId) return;

    const loadPage = async () => {
      setLoading(true);
      try {
        const fetchedPage = await fetchPageById(
          packageId,
          press3ObjectId,
          pageId,
        );
        if (fetchedPage) {
          setPage(fetchedPage);
          setPath(fetchedPage.path);

          // Fetch content from Walrus
          try {
            const walrusContent = await getFile(fetchedPage.walrusId);
            const textContent = new TextDecoder().decode(walrusContent);
            setContent(textContent || "");
            setOriginalContent(textContent || "");
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
  }, [pageId, packageId, press3ObjectId]);

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

    setSaveModalOpen(true);
    setSaveSuccess(false);
    setSaveError(null);
    setSaveStep(null);
    setTransactionDigests(null);

    try {
      const result = await savePageContent({
        packageId,
        press3ObjectId,
        pageIndex: pageData.index,
        pagePath: page.path,
        content,
        owner: currentAccount.address,
        epochs: 5,
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
        setTransactionDigests({
          register: result.walrusRegisterDigest,
          certify: result.walrusCertifyDigest,
          update: result.transactionDigest,
        });
      } else {
        setSaveError(result.error?.message || "Failed to save page");
      }
    } catch (error) {
      console.error("Failed to save page:", error);
      setSaveError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleCloseModal = () => {
    setSaveModalOpen(false);
    // Reset state when modal closes
    if (saveSuccess) {
      setSaveSuccess(false);
      setSaveStep(null);
      setSaveError(null);
      setTransactionDigests(null);
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

      <SaveProgressModal
        open={saveModalOpen}
        currentStep={saveStep}
        isSuccess={saveSuccess}
        error={saveError}
        transactionDigests={transactionDigests}
        onClose={handleCloseModal}
      />

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="path" className="font-medium">
            Page Path
          </label>
          <a
            href={page.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 no-underline"
          >
            <ExternalLink size={14} />
            Preview Page
          </a>
        </div>
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
        <RichEditor
          content={content}
          onChange={setContent}
          format={page.path.endsWith(".md") ? "markdown" : "html"}
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
          disabled={saveModalOpen || !hasChanges || !currentAccount}
        >
          Save Changes
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
