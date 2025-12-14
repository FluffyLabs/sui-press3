import { useMemo } from "react";
import { HtmlRenderer } from "./components/HtmlRenderer";
import { LayoutPage } from "./components/LayoutPage";
import { MultiStageLoader } from "./components/MultiStageLoader";
import { useLayout } from "./providers/LayoutProvider";

export function Page() {
  const { layout, rawContent, isLoading, error } = useLayout();
  const textContent = useMemo(() => {
    if (rawContent === null) {
      return "";
    }

    try {
      return new TextDecoder().decode(rawContent);
    } catch {
      return "";
    }
  }, [rawContent]);

  if (isLoading) {
    return <MultiStageLoader stage="pages" />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (layout) {
    return <LayoutPage layout={layout} />;
  }

  if (rawContent) {
    return <HtmlRenderer content={textContent} />;
  }

  return <div>No layout found</div>;
}
