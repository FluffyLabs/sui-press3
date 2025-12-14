import { Alert } from "@fluffylabs/shared-ui";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { usePress3 } from "../../providers/Press3Provider";
import { getFile } from "../../services/walrus";
import { setPageEditors } from "../services/editors";
import { fetchPageById } from "../services/pages";
import { type SaveStep, savePageContent } from "../services/save";
import type { Page } from "../types/page";
import { AdminLayout } from "./AdminLayout";
import { EditorsDialog } from "./EditorsDialog";
import { PageContentField } from "./PageContentField";
import { PageEditorHeader } from "./PageEditorHeader";
import { PageEditorsSection } from "./PageEditorsSection";
import { PagePathField } from "./PagePathField";
import { PageSaveActions } from "./PageSaveActions";
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
  const [editorsDialogOpen, setEditorsDialogOpen] = useState(false);
  const [isSavingEditors, setIsSavingEditors] = useState(false);
  const [editorsDialogError, setEditorsDialogError] = useState<string | null>(null);

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

  const handleBack = () => {
    navigate("/admin");
  };

  const handleOpenEditorsDialog = () => {
    setEditorsDialogOpen(true);
    setEditorsDialogError(null);
  };

  const handleEditorsDialogClose = (open: boolean) => {
    setEditorsDialogOpen(open);
    if (!open) {
      setEditorsDialogError(null);
      setIsSavingEditors(false);
    }
  };

  const handleSaveEditors = async (editors: string[]) => {
    if (!page || !currentAccount) return;

    const pageData = getPageWithIndex(page.path);
    if (!pageData) {
      setEditorsDialogError("Page not found in contract state");
      return;
    }

    setIsSavingEditors(true);
    setEditorsDialogError(null);

    try {
      await setPageEditors({
        packageId,
        press3ObjectId,
        pageIndex: pageData.index,
        pagePath: page.path,
        editors,
        signAndExecute: async (tx) => {
          const result = await signAndExecuteTransaction({ transaction: tx });
          return { digest: result.digest };
        },
      });

      // Update local page state
      setPage({ ...page, editors });
      setEditorsDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update editors";
      setEditorsDialogError(message);
    } finally {
      setIsSavingEditors(false);
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
        <PageEditorHeader onBack={handleBack} />
        <Alert>Page not found</Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageEditorHeader onBack={handleBack} />

      <SaveProgressModal
        open={saveModalOpen}
        currentStep={saveStep}
        isSuccess={saveSuccess}
        error={saveError}
        transactionDigests={transactionDigests}
        onClose={handleCloseModal}
      />

      <PagePathField path={path} />

      <PageContentField
        walrusId={page.walrusId}
        content={content}
        onChange={setContent}
      />

      <PageEditorsSection
        editors={page.editors}
        onEditClick={handleOpenEditorsDialog}
        canEdit={currentAccount ? canEditPage(page.path) : false}
      />

      <PageSaveActions
        onSave={handleSave}
        onCancel={handleBack}
        saveDisabled={saveModalOpen || !hasChanges || !currentAccount}
        walletConnected={Boolean(currentAccount)}
        canEdit={currentAccount ? canEditPage(page.path) : false}
        showSavingState={saveModalOpen}
      />

      <EditorsDialog
        open={editorsDialogOpen}
        pagePath={page.path}
        editors={page.editors}
        onOpenChange={handleEditorsDialogClose}
        onSave={handleSaveEditors}
        isSaving={isSavingEditors}
        errorMessage={editorsDialogError}
      />
    </AdminLayout>
  );
}
