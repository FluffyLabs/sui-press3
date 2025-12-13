import type { MenuSchema } from "../App";

interface Props {
  menu: MenuSchema;
  isOpen: boolean;
  currentPath: string;
}

function normalizePath(path: string): string {
  // Remove hash and query parameters
  const withoutHash = path.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  
  // Normalize: remove trailing slash except for root
  let normalized = withoutQuery;
  if (normalized !== "/" && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

export const Menu = ({ menu, isOpen, currentPath }: Props) => {
  const normalizedCurrentPath = normalizePath(currentPath);

  return (
    <nav className={`menu ${isOpen ? "menu-open" : ""}`}>
      <ul>
        {menu.map((item) => {
          const normalizedItemPath = normalizePath(item.url);
          const isActive = normalizedItemPath === normalizedCurrentPath;

          return (
            <li key={item.url}>
              <a
                href={item.url}
                target={item.target}
                rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                className={isActive ? "active" : ""}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
