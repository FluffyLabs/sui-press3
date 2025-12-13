import { LayoutPage } from "./components/LayoutPage";
import { MultiStageLoader } from "./components/MultiStageLoader";
import { useLayout } from "./providers/LayoutProvider";

export function Page() {
  const { layout, isLoading, error } = useLayout();

  if (isLoading) {
    return <MultiStageLoader stage="pages" />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!layout) {
    return <div>No layout found</div>;
  }

  return <LayoutPage layout={layout} />;
}
