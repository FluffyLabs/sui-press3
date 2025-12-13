import { useLocation } from "react-router-dom";
import { useWalrusContent } from "./hooks/useWalrusContent";
import { usePress3 } from "./providers/Press3Provider";

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

  console.log("Page:", { path, walrusId, content, isLoadingContent, error });

  if (isLoadingContent || isLoadingPages) {
    return <div>Loading...</div>;
  }

  if (!walrusId) {
    return <div>Page not found: {path}</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{content}</div>;
}
