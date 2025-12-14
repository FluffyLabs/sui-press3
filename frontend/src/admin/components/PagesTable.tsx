import { Badge } from "@fluffylabs/shared-ui";
import { Check, History, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import type { Page } from "../types/page";
import { EditorsDialog } from "./EditorsDialog";

interface Props {
  pages: Page[];
  admins: string[];
  onUpdateEditors: (page: Page, editors: string[]) => Promise<void>;
  canEditEditors: boolean;
}

export function PagesTable({
  pages,
  admins,
  onUpdateEditors,
  canEditEditors,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isSavingEditors, setIsSavingEditors] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const formatAddress = (address: string) => {
    // Show first 6 and last 4 characters
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getAllEditors = (pageEditors: string[]) => {
    // Merge admins with page editors, ensuring admins are always included and unique
    const allEditors = [...new Set([...admins, ...pageEditors])];
    return allEditors;
  };

  const isAdmin = (editor: string) => {
    return admins.includes(editor);
  };

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) || null,
    [pages, selectedPageId],
  );

  const handleOpenEditors = (pageId: string) => {
    if (!canEditEditors) return;
    setSelectedPageId(pageId);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedPageId(null);
      setDialogError(null);
      setIsSavingEditors(false);
    }
  };

  const handleSaveEditors = async (editors: string[]) => {
    if (!selectedPage || isSavingEditors) return;
    setDialogError(null);
    setIsSavingEditors(true);
    try {
      await onUpdateEditors(selectedPage, editors);
      handleDialogOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "Unknown error");
      setDialogError(message);
    } finally {
      setIsSavingEditors(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 text-left">
            <th className="px-4 py-3 font-semibold">Page Path</th>
            <th className="px-4 py-3 font-semibold">Block</th>
            <th className="px-4 py-3 font-semibold">Walrus Quilt ID</th>
            <th className="px-4 py-3 font-semibold">Editors</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} className="border-b border-gray-200">
              <td className="px-4 py-3">
                <Link
                  to={`/admin/edit/${page.id}`}
                  className="text-blue-500 no-underline font-medium hover:text-blue-600"
                >
                  {page.path}
                </Link>
              </td>
              <td
                className="px-4 py-3 text-gray-500"
                data-tooltip-id="block-tooltip"
                data-tooltip-content={
                  page.registeredAtBlock && page.updatedAtBlock
                    ? `Registered: #${page.registeredAtBlock.toLocaleString()}\nLast Updated: #${page.updatedAtBlock.toLocaleString()}`
                    : undefined
                }
              >
                {page.updatedAtBlock || page.registeredAtBlock ? (
                  <>
                    <div>
                      #
                      {(
                        page.updatedAtBlock || page.registeredAtBlock
                      )?.toLocaleString()}
                    </div>
                    {page.updatedAtBlock &&
                      page.registeredAtBlock &&
                      page.updatedAtBlock !== page.registeredAtBlock && (
                        <div className="text-[11px] text-green-600 mt-0.5">
                          Updated
                        </div>
                      )}
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">N/A</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono flex-none cursor-copy border-0"
                    onClick={() => copyToClipboard(page.walrusId, page.id)}
                    data-tooltip-id="walrus-tooltip"
                    data-tooltip-content={
                      copiedId === page.id ? "Copied" : "Copy to clipboard"
                    }
                  >
                    {page.walrusId}
                  </button>
                  {page.previousWalrusId &&
                  typeof page.previousWalrusId === "string" ? (
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          page.previousWalrusId as string,
                          `${page.id}-prev`,
                        )
                      }
                      data-tooltip-id="walrus-tooltip"
                      data-tooltip-content={
                        copiedId === `${page.id}-prev`
                          ? "Copied!"
                          : "Copy walrus quilt id of previous content"
                      }
                      className="bg-transparent border border-gray-300 rounded px-2 py-1 cursor-pointer text-gray-500 hover:bg-gray-50"
                    >
                      {copiedId === `${page.id}-prev` ? (
                        <Check size={14} />
                      ) : (
                        <History size={14} />
                      )}
                    </button>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5 flex-wrap items-center">
                  {getAllEditors(page.editors).map((editor) => (
                    <Badge
                      key={editor}
                      data-tooltip-id="editor-tooltip"
                      data-tooltip-content={
                        isAdmin(editor) ? "admin" : "editor"
                      }
                      className={
                        isAdmin(editor)
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : ""
                      }
                    >
                      {formatAddress(editor)}
                    </Badge>
                  ))}
                  {canEditEditors && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditors(page.id)}
                      className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded text-gray-500 hover:text-gray-900 hover:border-gray-400 cursor-pointer"
                      data-tooltip-id="editor-tooltip"
                      data-tooltip-content="Edit editors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="sr-only">Edit editors for {page.path}</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Tooltip id="block-tooltip" style={{ whiteSpace: "pre-line" }} />
      <Tooltip id="walrus-tooltip" />
      <Tooltip id="editor-tooltip" />

      {selectedPage && (
        <EditorsDialog
          open={dialogOpen}
          pagePath={selectedPage.path}
          editors={selectedPage.editors}
          onOpenChange={handleDialogOpenChange}
          onSave={handleSaveEditors}
          isSaving={isSavingEditors}
          errorMessage={dialogError}
        />
      )}
    </div>
  );
}
