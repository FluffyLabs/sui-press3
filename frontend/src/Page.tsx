import { HtmlRenderer } from "./components/HtmlRenderer";
import { LayoutPage } from "./components/LayoutPage";
import { MultiStageLoader } from "./components/MultiStageLoader";
import { useLayout } from "./providers/LayoutProvider";

export function Page() {
  const { layout, rawContent, isLoading, error } = useLayout();

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
    return <HtmlRenderer content={rawContent} />;
  }

  return <div>No layout found</div>;
}
