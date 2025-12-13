import { useLocation } from "react-router-dom";
import { HtmlRenderer } from "./components/HtmlRenderer";
import { JsonRenderer } from "./components/JsonRenderer";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { MultiStageLoader } from "./components/MultiStageLoader";
import { NotFoundPage } from "./components/NotFoundPage";
import { useWalrusContent } from "./hooks/useWalrusContent";
import { usePress3 } from "./providers/Press3Provider";

type Renderer = "html" | "markdown" | "json";

function getRenderer(path: string): Renderer | null {
  if (path.endsWith(".html") || path === "/" || path === "") return "html";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".json")) return "json";
  return null;
}

export function Page() {
  const location = useLocation();
  const { pages, isLoading: isLoadingPages } = usePress3();
  const path = location.pathname;

  const walrusId = pages.get(path) ?? null;
  const {
    content,
    isLoading: isLoadingContent,
    error,
  } = useWalrusContent(walrusId);

  const renderer = getRenderer(path);

  if (isLoadingPages) {
    return <MultiStageLoader stage="pages" />;
  }

  if (isLoadingContent) {
    return <MultiStageLoader stage="content" />;
  }

  if (!walrusId) {
    return <NotFoundPage path={path} />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!content) {
    return <div>No content</div>;
  }

  switch (renderer) {
    case "html":
      return <HtmlRenderer content={content} />;
    case "markdown":
      return <MarkdownRenderer content={content} />;
    case "json":
      return <JsonRenderer content={content} />;
    default:
      return <div>{content}</div>;
  }
}
