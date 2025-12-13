import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { HtmlRenderer } from "./components/HtmlRenderer";
import { JsonRenderer } from "./components/JsonRenderer";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { Menu } from "./components/Menu";
import { Sidebar } from "./components/Sidebar";
import { usePress3 } from "./providers/Press3Provider";
import { getFile } from "./services/walrus";
import type { TocItem } from "./utils/rehype-collect-headings";

type Renderer = "html" | "markdown" | "json";

type PageEvent = {
  path: string;
  walrusId: string;
  lastEditor: string;
  updatedAt: string;
};

export type MenuSchema = Array<{ label: string; url: string; target: string }>;

const DESKTOP_BREAKPOINT = 768; // pixels - matches CSS media query

function getRenderer(path: string): Renderer | null {
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".json")) return "json";
  return null;
}

async function mockFetchContent(walrusId: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  switch (walrusId) {
    case "walrus://blob/main-menu":
      return "<h1>Welcome to Press3</h1><p>This is the home page.</p>";
    case "walrus://blob/wiki-page":
      return "# Press3 Wiki\n\nThis is a decentralized CMS built on SUI.";
    case "walrus://blob/navigation":
      return '[{"label":"Home","url":"/","target":"_self"},{"label":"Docs","url":"/docs","target":"_self"}]';
    default:
      return "Content not found";
  }
}

const PAGE_EVENTS: PageEvent[] = [
  {
    path: "/index.html",
    walrusId: "walrus://blob/main-menu",
    lastEditor: "0xDeployer",
    updatedAt: "2024-10-12T10:35:00Z",
  },
  {
    path: "/wiki/press3.md",
    walrusId: "walrus://blob/wiki-page",
    lastEditor: "0xEditor",
    updatedAt: "2024-10-13T08:12:11Z",
  },
  {
    path: "/menu",
    walrusId: "walrus://blob/navigation",
    lastEditor: "0xCMSAdmin",
    updatedAt: "2024-10-13T09:02:45Z",
  },
];

const MENU_SCHEMA: MenuSchema = [
  { label: "Home", url: "/", target: "_self" },
  { label: "Docs", url: "/docs", target: "_self" },
  { label: "Forum", url: "/forum", target: "_self" },
];

const ASSET_BINDINGS = [
  { logicalPath: "/style.css", walrusId: "walrus://blob/theme" },
  { logicalPath: "/logo.png", walrusId: "walrus://blob/brandmark" },
];

function Dev() {
  const [selectedPath, setSelectedPath] = useState(PAGE_EVENTS[0]?.path ?? "");
  const pages = usePress3().pages;

  console.log(pages);
  // Test Walrus fetch
  useEffect(() => {
    const testWalrusFetch = async () => {
      try {
        const content = await getFile(
          "GR6AiGuu5MJIiBPTGw5uEULqjvYZ9YGgtBa6-UwoTZQ",
        );
        console.log("Walrus content:", content);
      } catch (error) {
        console.error("Walrus fetch error:", error);
      }
    };
    testWalrusFetch();
  }, []);

  const handlePatchChange = (path: string) => {
    setSelectedPath(path);
  };

  const [fetchedContent, setFetchedContent] = useState<{
    walrusId: string;
    content: string;
  } | null>(null);
  const [menu, setMenu] = useState<MenuSchema | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  const activeEvent = useMemo(() => {
    const event = PAGE_EVENTS.find((evt) => evt.path === selectedPath);
    if (event) {
      return { ...event, renderer: getRenderer(event.path) };
    }
    return null;
  }, [selectedPath]);

  const menuEvent = useMemo(() => {
    return PAGE_EVENTS.find((evt) => evt.path === "/menu");
  }, []);

  useEffect(() => {
    setTocItems([]);

    if (!activeEvent) {
      return;
    }

    let cancelled = false;

    const fetchContent = async () => {
      setFetchedContent(null);
      const content = await mockFetchContent(activeEvent.walrusId);
      if (!cancelled) {
        setFetchedContent({ walrusId: activeEvent.walrusId, content });
      }
    };

    fetchContent();

    return () => {
      cancelled = true;
    };
  }, [activeEvent]);

  // Auto-hide sidebar when there are no TOC items, auto-show when items appear (on desktop)
  useEffect(() => {
    if (tocItems.length === 0) {
      setIsSidebarOpen(false);
    } else {
      // On desktop, show sidebar when TOC items appear
      const isDesktop = window.matchMedia(
        `(min-width: ${DESKTOP_BREAKPOINT}px)`,
      ).matches;
      if (isDesktop) {
        setIsSidebarOpen(true);
      }
    }
  }, [tocItems]);

  useEffect(() => {
    if (!menuEvent) {
      return;
    }

    let cancelled = false;

    const fetchMenu = async () => {
      const content = await mockFetchContent(menuEvent.walrusId);
      if (!cancelled) {
        try {
          const parsedMenu: MenuSchema = JSON.parse(content);
          if (Array.isArray(parsedMenu) && parsedMenu.length > 0) {
            setMenu(parsedMenu);
          } else {
            setMenu(null);
          }
        } catch {
          setMenu(null);
        }
      }
    };

    fetchMenu();

    return () => {
      cancelled = true;
    };
  }, [menuEvent]);

  useEffect(() => {
    const isDesktop = window.matchMedia(
      `(min-width: ${DESKTOP_BREAKPOINT}px)`,
    ).matches;
    setIsSidebarOpen(isDesktop);
  }, []);

  return (
    <div className="app">
      <Sidebar tocItems={tocItems} isOpen={isSidebarOpen} />
      <div className={`app-main ${!isSidebarOpen ? "sidebar-hidden" : ""}`}>
        <header>
          <div className="header-top">
            {tocItems.length > 0 && (
              <button
                type="button"
                className="hamburger"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle sidebar"
                aria-expanded={isSidebarOpen}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            )}
            <h1>Press3 Frontend Sandbox</h1>
          </div>
          <p>
            This Vite + React shell visualizes how the public renderer will map
            CMS events to Walrus blobs, menu metadata, and smart-contract driven
            assets.
          </p>
          {menu && menu.length > 0 && (
            <Menu menu={menu} currentPath={selectedPath} />
          )}
        </header>

        <section className="panel">
          <div className="panel-heading">
            <h2>Latest page events</h2>
            <span className="hint">replace with on-chain subscription</span>
          </div>
          <ul className="event-list">
            {PAGE_EVENTS.map((event) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: prototype UI
              <li
                key={event.path}
                className={selectedPath === event.path ? "active" : ""}
                onClick={() => handlePatchChange(event.path)}
              >
                <div className="event-title">{event.path}</div>
                <div className="event-meta">
                  <span>
                    {(getRenderer(event.path) || "unknown").toUpperCase()}
                  </span>
                  <span>{event.updatedAt}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Walrus blob preview</h2>
            <span className="hint">
              render HTML/Markdown assets based on suffix
            </span>
          </div>
          {activeEvent ? (
            <div className="preview">
              <div className="preview-row">
                <span>Path</span>
                <code>{activeEvent.path}</code>
              </div>
              <div className="preview-row">
                <span>Walrus ID</span>
                <code>{activeEvent.walrusId}</code>
              </div>
              <div className="preview-row">
                <span>Renderer</span>
                <code>{activeEvent.renderer}</code>
              </div>
              <div className="preview-row">
                <span>Last editor</span>
                <code>{activeEvent.lastEditor}</code>
              </div>
              <div className="preview-row">
                <span>Updated at</span>
                <code>{activeEvent.updatedAt}</code>
              </div>
              <div className="preview-row">
                <span>Content</span>
                <div>
                  {fetchedContent ? (
                    <div className="rendered-content">
                      {activeEvent.renderer === "html" && (
                        <HtmlRenderer
                          content={fetchedContent.content}
                          onTocExtracted={setTocItems}
                        />
                      )}
                      {activeEvent.renderer === "markdown" && (
                        <MarkdownRenderer
                          content={fetchedContent.content}
                          onTocExtracted={setTocItems}
                        />
                      )}
                      {activeEvent.renderer === "json" &&
                        activeEvent.path !== "/menu" && (
                          <JsonRenderer content={fetchedContent.content} />
                        )}
                      {activeEvent.path === "/menu" && (
                        <p>Menu is rendered as a navigation component above.</p>
                      )}
                    </div>
                  ) : (
                    <p>Content not fetched yet.</p>
                  )}
                </div>
              </div>
              <p className="preview-description">
                Replace this card with the actual Walrus fetch logic. The
                renderer should hydrate menu JSON automatically and inject
                resolved assets (CSS, images, etc.) after querying the contract.
              </p>
            </div>
          ) : (
            <p>No page selected yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Menu schema</h2>
            <span className="hint">served from /menu blob</span>
          </div>
          <pre className="code-block">
            {JSON.stringify(MENU_SCHEMA, null, 2)}
          </pre>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Smart-contract asset bindings</h2>
            <span className="hint">resolve URLs via Walrus quilt paths</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Logical path</th>
                <th>Walrus reference</th>
              </tr>
            </thead>
            <tbody>
              {ASSET_BINDINGS.map((binding) => (
                <tr key={binding.logicalPath}>
                  <td>{binding.logicalPath}</td>
                  <td>
                    <code>{binding.walrusId}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer>
          <p>
            Next steps: wire this scaffold to the Move contract events, hydrate
            Walrus fetchers, and integrate the zkLogin-aware editing UX.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default Dev;
