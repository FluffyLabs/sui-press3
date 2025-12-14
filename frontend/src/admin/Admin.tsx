import { Alert, Badge, Button } from "@fluffylabs/shared-ui";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { usePress3 } from "../providers/Press3Provider";
import { fetchEnrichedPages } from "../services/enrichedPages";
import { AdminLayout } from "./components/AdminLayout";
import { PagesTable } from "./components/PagesTable";
import { setPageEditors } from "./services/editors";
import type { Page } from "./types/page";

function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { packageId, press3ObjectId, getPageWithIndex } = usePress3();
  const [pages, setPages] = useState<Page[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPages = async () => {
      setLoading(true);
      try {
        const { pages: fetchedPages, admins: fetchedAdmins } =
          await fetchEnrichedPages(packageId, press3ObjectId);
        setPages(fetchedPages);
        setAdmins(fetchedAdmins);
      } catch (error) {
        console.error("Failed to load pages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, [packageId, press3ObjectId]);

  const handleUpdateEditors = async (page: Page, updatedEditors: string[]) => {
    if (!currentAccount) {
      throw new Error("Connect your wallet to update editors.");
    }
    if (!isAdmin) {
      throw new Error("Only admins can update editors.");
    }

    const pageData = getPageWithIndex(page.path);
    if (!pageData) {
      throw new Error("Page not found in contract state.");
    }

    await setPageEditors({
      packageId,
      press3ObjectId,
      pageIndex: pageData.index,
      pagePath: page.path,
      editors: updatedEditors,
      signAndExecute: async (tx) => {
        const result = await signAndExecuteTransaction({ transaction: tx });
        return { digest: result.digest };
      },
    });

    setPages((prev) =>
      prev.map((candidate) =>
        candidate.id === page.id
          ? { ...candidate, editors: updatedEditors }
          : candidate,
      ),
    );
  };

  return (
    <AdminLayout
      headerEndSlot={
        isAdmin ? (
          <Button className="mr-4" onClick={() => navigate("/admin/create")}>
            Create New Page
          </Button>
        ) : undefined
      }
    >
      <Alert className="my-4">
        <p>
          All pages are stored on Walrus and path to blob id is stored in SUI
          smart contracts.
        </p>
      </Alert>

      <div className="mb-5">
        <div className="flex gap-2.5 mb-5">
          <Badge>{pages.length} Total Pages</Badge>
          <a
            href={`https://suiscan.xyz/testnet/object/${packageId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
            title={`View package on Suiscan: ${packageId}`}
          >
            <Badge>
              Package: {packageId.slice(0, 6)}...{packageId.slice(-4)}
            </Badge>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500">Loading pages...</div>
      ) : pages.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          No pages found. Create your first page to get started.
        </div>
      ) : (
        <PagesTable
          pages={pages}
          admins={admins}
          onUpdateEditors={handleUpdateEditors}
          canEditEditors={isAdmin}
        />
      )}
    </AdminLayout>
  );
}

export default Admin;
