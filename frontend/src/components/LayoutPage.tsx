import type { PageLayout } from "../types";
import { CmsLayout } from "./CmsLayout";
import { WikiLayout } from "./WikiLayout";

interface Props {
  layout: PageLayout;
}

export function LayoutPage({ layout }: Props) {
  if (layout.mode === "wiki") {
    return <WikiLayout layout={layout} />;
  }
  return <CmsLayout layout={layout} />;
}
