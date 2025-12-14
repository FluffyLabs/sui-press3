import { Alert, Button, Input, Textarea } from "@fluffylabs/shared-ui";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { ArrowLeft, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { usePress3 } from "../../providers/Press3Provider";
import { createPageContent } from "../services/create";
import type { SaveStep } from "../services/save";
import { AdminLayout } from "./AdminLayout";
import { SaveProgressModal } from "./SaveProgressModal";

export function PageCreate() {
  const navigate = useNavigate();
  const { packageId, press3ObjectId } = usePress3();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { isAdmin } = usePermissions();

  const [path, setPath] = useState("");
  const [content, setContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveStep, setSaveStep] = useState<SaveStep | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [transactionDigests, setTransactionDigests] = useState<{
    register?: string;
    certify?: string;
    update?: string;
  } | null>(null);

  // Convert filename to URL-friendly path
  const filenameToPath = (filename: string): string => {
    // Convert to lowercase and replace spaces/special chars with hyphens
    const urlFriendly = filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `/${urlFriendly}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];

    // Auto-fill path from filename if not already set
    if (!path) {
      setPath(filenameToPath(file.name));
    }

    // Read file content
    const text = await file.text();
    setContent(text);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Auto-fill path from filename if not already set
    if (!path) {
      setPath(filenameToPath(file.name));
    }

    // Read file content
    const text = await file.text();
    setContent(text);
  };

  const handleCreate = async () => {
    if (!currentAccount) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isAdmin) {
      alert(
        "Only admins can create new pages. Please connect with an admin account.",
      );
      return;
    }

    if (!path || !content) {
      alert("Please provide both path and content");
      return;
    }

    if (!press3ObjectId) {
      alert("Press3 object not initialized");
      return;
    }

    setSaveModalOpen(true);
    setSaveSuccess(false);
    setSaveError(null);
    setSaveStep(null);
    setTransactionDigests(null);

    try {
      const result = await createPageContent({
        packageId,
        press3ObjectId,
        pagePath: path,
        content,
        owner: currentAccount.address,
        epochs: 5, // Store for 5 epochs (~30 days) to reduce storage costs
        signAndExecute: async (tx) => {
          const result = await signAndExecuteTransaction({ transaction: tx });
          return { digest: result.digest };
        },
        onProgress: (step) => setSaveStep(step),
      });

      if (result.success) {
        setSaveSuccess(true);
        setTransactionDigests({
          register: result.walrusRegisterDigest,
          certify: result.walrusCertifyDigest,
          update: result.transactionDigest,
        });
      } else {
        setSaveError(result.error?.message || "Failed to create page");
      }
    } catch (error) {
      console.error("Failed to create page:", error);
      setSaveError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleCloseModal = () => {
    setSaveModalOpen(false);
    if (saveSuccess) {
      // Navigate back to admin page after successful creation
      navigate("/admin");
    }
  };

  // Check admin access
  if (!isAdmin && currentAccount) {
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
        <Alert>
          Only admins can create new pages. Please connect with an admin
          account.
        </Alert>
      </AdminLayout>
    );
  }

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

      <SaveProgressModal
        open={saveModalOpen}
        currentStep={saveStep}
        isSuccess={saveSuccess}
        error={saveError}
        transactionDigests={transactionDigests}
        onClose={handleCloseModal}
      />

      <h1 className="text-2xl font-bold mb-6">Create New Page</h1>

      <div className="mb-5">
        <label htmlFor="content" className="block mb-2 font-medium">
          Page Content
        </label>

        {/* Drag and Drop Area */}
        {content.length === 0 && (
          // biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop area with file input fallback
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <Upload
              size={48}
              className={`mx-auto mb-4 ${
                isDragging ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <p className="text-lg font-medium mb-2">
              Drop a file here or click to browse
            </p>
            <p className="text-sm text-gray-600 mb-4">
              The filename will automatically set the page path
            </p>
            <input
              type="file"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
              accept=".txt,.md,.html,.css,.js,.json"
            />
            <label htmlFor="file-input">
              <Button variant="secondary" className="cursor-pointer" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        )}

        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Or paste your content here..."
          rows={20}
          className="font-mono text-sm w-full"
        />
      </div>

      <div className="mb-5">
        <label htmlFor="path" className="block mb-2 font-medium">
          Page Path
        </label>
        <Input
          id="path"
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/my-page"
          className="w-full"
        />
        <p className="text-sm text-gray-600 mt-1">
          The URL path for this page (e.g., /about, /blog/my-post)
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleCreate}
          disabled={saveModalOpen || !path || !content || !currentAccount}
        >
          Create Page
        </Button>
        <Button variant="secondary" onClick={() => navigate("/admin")}>
          Cancel
        </Button>
      </div>
    </AdminLayout>
  );
}
