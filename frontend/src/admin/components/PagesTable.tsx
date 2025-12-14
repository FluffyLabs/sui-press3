import { Badge } from "@fluffylabs/shared-ui";
import { Check, History } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import type { Page } from "../types/page";

interface Props {
  pages: Page[];
  admins: string[];
}

export function PagesTable({ pages, admins }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
                <div className="flex gap-1.5 flex-wrap">
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Tooltip id="block-tooltip" style={{ whiteSpace: "pre-line" }} />
      <Tooltip id="walrus-tooltip" />
      <Tooltip id="editor-tooltip" />
    </div>
  );
}
