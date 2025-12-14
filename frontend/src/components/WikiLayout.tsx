import { useLocation } from "react-router-dom";
import type { WikiLayout as WikiLayoutType } from "../types";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
  layout: WikiLayoutType;
}

export function WikiLayout({ layout }: Props) {
  const location = useLocation();
  const contentPath =
    location.pathname === "/" ? layout.content : location.pathname;

  return (
    <div className="wiki-layout">
      {layout.header && (
        <header className="wiki-header">
          <ContentRenderer path={layout.header} />
        </header>
      )}
      <div className="wiki-body">
        {layout.sidenav && (
          <nav className="wiki-sidenav">
            <ContentRenderer path={layout.sidenav} />
          </nav>
        )}
        <main className="wiki-content max-w-[1280px] mx-auto p-8">
          <ContentRenderer path={contentPath} />
        </main>
      </div>
      {layout.footer && (
        <footer className="wiki-footer">
          <ContentRenderer path={layout.footer} />
        </footer>
      )}
    </div>
  );
}
