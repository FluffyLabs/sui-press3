import type { Root } from "hast";
import { toText } from "hast-util-to-text";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

declare module "vfile" {
  interface DataMap {
    toc: TocItem[];
  }
}

/**
 * Rehype plugin that collects headings and stores them in file.data.toc
 */
export const rehypeCollectHeadings: Plugin<[], Root> = () => {
  return (tree, file: VFile) => {
    const items: TocItem[] = [];

    visit(tree, "element", (node) => {
      if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
        const text = toText(node).trim();

        if (text) {
          // Get ID from properties (should be added by rehype-slug)
          let id = "";
          if (node.properties?.id && typeof node.properties.id === "string") {
            id = node.properties.id;
          } else {
            // Fallback: generate ID from text
            id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .trim();
          }

          // Ensure unique IDs
          let uniqueId = id;
          let counter = 1;
          while (items.some((item) => item.id === uniqueId)) {
            uniqueId = `${id}-${counter}`;
            counter++;
          }

          items.push({
            id: uniqueId,
            text,
            level: parseInt(node.tagName.charAt(1), 10),
          });
        }
      }
    });

    // Store TOC in file data
    file.data.toc = items;
  };
};
