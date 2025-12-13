import type { MenuSchema } from "../Dev";

interface Props {
  menu: MenuSchema;
  currentPath: string;
}

export const Menu = ({ menu, currentPath }: Props) => {
  return (
    <nav className="menu">
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
