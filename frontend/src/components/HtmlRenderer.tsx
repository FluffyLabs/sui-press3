import { useEffect, useState } from "react";
import rehypeParse from "rehype-parse";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { TocItem } from "../utils/rehype-collect-headings";
import { rehypeCollectHeadings } from "../utils/rehype-collect-headings";

interface Props {
  content: string;
  onTocExtracted?: (toc: TocItem[]) => void;
}

export const HtmlRenderer = ({ content, onTocExtracted }: Props) => {
  const [processedContent, setProcessedContent] = useState<string>("");

  useEffect(() => {
    // Process HTML through rehype pipeline to add IDs to headings and collect TOC
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeSlug)
      .use(rehypeCollectHeadings)
      .use(rehypeStringify);

    processor
      .process(content)
      .then((file) => {
        setProcessedContent(String(file));

        // Extract TOC from file data
        if (file.data?.toc && onTocExtracted) {
          onTocExtracted(file.data.toc);
        }
      })
      .catch((error) => {
        console.error("Error processing HTML:", error);
        setProcessedContent(content); // Fallback to original content
      });
  }, [content, onTocExtracted]);

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional HTML rendering
      dangerouslySetInnerHTML={{ __html: processedContent || content }}
    />
  );
};
