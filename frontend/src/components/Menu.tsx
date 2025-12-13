import type { MenuSchema } from "../App";

interface Props {
  menu: MenuSchema;
}

export const Menu = ({ menu }: Props) => (
  <nav className="menu">
    <ul>
      {menu.map((item) => (
        <li key={item.url}>
          <a href={item.url} target={item.target} rel={item.target === "_blank" ? "noopener noreferrer" : undefined}>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);
