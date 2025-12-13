import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { rehypeCollectHeadings } from "../utils/rehype-collect-headings";
import type { TocItem } from "../utils/rehype-collect-headings";

interface Props {
  content: string;
  onTocExtracted?: (toc: TocItem[]) => void;
}

export const MarkdownRenderer = ({ content, onTocExtracted }: Props) => {
  const [processedHtml, setProcessedHtml] = useState<string>("");

  // Process markdown with unified to extract TOC and get HTML
  useEffect(() => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeCollectHeadings)
      .use(rehypeStringify);

    processor
      .process(content)
      .then((file) => {
        const html = String(file);
        setProcessedHtml(html);

        // Extract TOC from file data
        if (file.data?.toc && onTocExtracted) {
          onTocExtracted(file.data.toc);
        }
      })
      .catch((error) => {
        console.error("Error processing markdown:", error);
        // Fallback to react-markdown if processing fails
        setProcessedHtml("");
      });
  }, [content, onTocExtracted]);

  // If processing succeeded, render the HTML directly
  if (processedHtml) {
    return (
      <div
        className="markdown-content"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: processed through unified
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    );
  }

  // Fallback to react-markdown
  return (
    <div className="markdown-content">
      <ReactMarkdown rehypePlugins={[rehypeSlug]}>{content}</ReactMarkdown>
    </div>
  );
};
