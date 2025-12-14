import { Alert, Badge, Button } from "@fluffylabs/shared-ui";
import { useEffect, useState } from "react";
import { usePress3 } from "../providers/Press3Provider";
import { fetchEnrichedPages } from "../services/enrichedPages";
import { AdminLayout } from "./components/AdminLayout";
import { PagesTable } from "./components/PagesTable";
import type { Page } from "./types/page";

function Admin() {
  const { packageId, press3ObjectId } = usePress3();
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

  return (
    <AdminLayout
      headerEndSlot={<Button className="mr-4">Create New Page</Button>}
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
        <PagesTable pages={pages} admins={admins} />
      )}
    </AdminLayout>
  );
}

export default Admin;
