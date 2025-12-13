import { Badge } from "@fluffylabs/shared-ui";
import { Link } from "react-router-dom";
import type { Page } from "../types/page";

interface Props {
  pages: Page[];
}

export function PagesTable({ pages }: Props) {
  const formatAddress = (address: string) => {
    // Show first 6 and last 4 characters
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #e5e7eb",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "12px 16px", fontWeight: 600 }}>Page Path</th>
            <th style={{ padding: "12px 16px", fontWeight: 600 }}>
              Registered Block
            </th>
            <th style={{ padding: "12px 16px", fontWeight: 600 }}>
              Updated Block
            </th>
            <th style={{ padding: "12px 16px", fontWeight: 600 }}>Editors</th>
            <th style={{ padding: "12px 16px", fontWeight: 600 }}>
              Previous Blob
            </th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr
              key={page.id}
              style={{
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <td style={{ padding: "12px 16px" }}>
                <Link
                  to={`/admin/edit/${page.id}`}
                  style={{
                    color: "#3b82f6",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {page.path}
                </Link>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    marginTop: "4px",
                    fontFamily: "monospace",
                  }}
                  title={page.walrusId}
                >
                  {page.walrusId.slice(0, 20)}...
                </div>
              </td>
              <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                #{page.registeredAtBlock.toLocaleString()}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div>#{page.updatedAtBlock.toLocaleString()}</div>
                {page.updatedAtBlock !== page.registeredAtBlock && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#16a34a",
                      marginTop: "2px",
                    }}
                  >
                    Updated
                  </div>
                )}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {page.editors.map((editor) => (
                    <Badge key={editor} title={editor}>
                      {formatAddress(editor)}
                    </Badge>
                  ))}
                </div>
              </td>
              <td style={{ padding: "12px 16px" }}>
                {page.previousWalrusId ? (
                  <code
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      backgroundColor: "#f3f4f6",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                    }}
                    title={page.previousWalrusId}
                  >
                    {page.previousWalrusId.slice(0, 12)}...
                  </code>
                ) : (
                  <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                    Initial version
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
