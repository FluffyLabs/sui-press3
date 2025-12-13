import { useLocation } from "react-router-dom";
import type { CmsLayout as CmsLayoutType } from "../types";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
  layout: CmsLayoutType;
}

export function CmsLayout({ layout }: Props) {
  const location = useLocation();
  const contentPath =
    location.pathname === "/" ? layout.content : location.pathname;

  return (
    <>
      {layout.header && <ContentRenderer path={layout.header} />}
      <ContentRenderer path={contentPath} />
      {layout.footer && <ContentRenderer path={layout.footer} />}
    </>
  );
}
