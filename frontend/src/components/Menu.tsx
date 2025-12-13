import type { MenuSchema } from "../Dev";

interface Props {
  menu: MenuSchema;
  isOpen: boolean;
  currentPath: string;
}

export const Menu = ({ menu, isOpen, currentPath }: Props) => {
  return (
    <nav className={`menu ${isOpen ? "menu-open" : ""}`}>
      <ul>
        {menu.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target={item.target}
              rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
              className={item.url === currentPath ? "active" : ""}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
