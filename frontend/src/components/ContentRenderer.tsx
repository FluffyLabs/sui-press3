import { useMemo } from "react";
import { useWalrusContent } from "../hooks/useWalrusContent";
import { usePress3 } from "../providers/Press3Provider";
import { HtmlRenderer } from "./HtmlRenderer";
import { ImgRenderer } from "./ImgRenderer";
import { JsonRenderer } from "./JsonRenderer";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MultiStageLoader } from "./MultiStageLoader";
import { NotFoundPage } from "./NotFoundPage";
import { RawRenderer } from "./RawRenderer";

type Renderer = "html" | "markdown" | "json" | "raw" | "img";

function getRenderer(p: string): Renderer {
  const path = p.toLowerCase();
  if (path === "/") return "html";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".png")) return "img";
  if (path.endsWith(".jpg")) return "img";
  if (path.endsWith(".gif")) return "img";
  return "raw";
}

interface Props {
  path: string;
  className?: string;
}

export function ContentRenderer({ path, className }: Props) {
  const { pages } = usePress3();
  const walrusId = pages.get(path) ?? null;
  const { content, isLoading, error } = useWalrusContent(walrusId);

  const textContent = useMemo(() => {
    if (content === null) {
      return "";
    }

    try {
      return new TextDecoder().decode(content);
    } catch {
      return "";
    }
  }, [content]);

  if (!walrusId) {
    return <NotFoundPage path={path} />;
  }

  if (isLoading) {
    return <MultiStageLoader stage="content" />;
  }

  if (error) {
    return <div className={className}>Error: {error.message}</div>;
  }

  if (!content) {
    return null;
  }

  const renderer = getRenderer(path);

  return (
    <div className={className}>
      {renderer === "markdown" && <MarkdownRenderer content={textContent} />}
      {renderer === "html" && <HtmlRenderer content={textContent} />}
      {renderer === "json" && <JsonRenderer content={textContent} />}
      {renderer === "img" && <ImgRenderer content={content} name={path} />}
      {renderer === "raw" && <RawRenderer content={textContent} />}
    </div>
  );
}
