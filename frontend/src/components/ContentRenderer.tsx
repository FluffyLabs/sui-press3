import { useWalrusContent } from "../hooks/useWalrusContent";
import { usePress3 } from "../providers/Press3Provider";
import { HtmlRenderer } from "./HtmlRenderer";
import { MarkdownRenderer } from "./MarkdownRenderer";

type Renderer = "html" | "markdown";

function getRenderer(path: string): Renderer {
  if (path.endsWith(".md")) return "markdown";
  return "html";
}

interface Props {
  path: string;
  className?: string;
}

export function ContentRenderer({ path, className }: Props) {
  const { pages } = usePress3();
  const walrusId = pages.get(path) ?? null;
  const { content, isLoading, error } = useWalrusContent(walrusId);

  if (!walrusId) {
    return null;
  }

  if (isLoading) {
    return <div className={className}>Loading...</div>;
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
      {renderer === "markdown" ? (
        <MarkdownRenderer content={content} />
      ) : (
        <HtmlRenderer content={content} />
      )}
    </div>
  );
}
