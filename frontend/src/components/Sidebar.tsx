import { useEffect, useState } from "react";
import "./Sidebar.css";
import type { TocItem } from "../utils/rehype-collect-headings";

interface Props {
  tocItems: TocItem[];
}

export const Sidebar = ({ tocItems }: Props) => {
  const [activeId, setActiveId] = useState<string>("");


  // Track active heading on scroll
  useEffect(() => {
    if (tocItems.length === 0) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for better UX

      // Find the heading that's currently in view
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const element = document.getElementById(tocItems[i].id);
        if (element) {
          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          if (scrollPosition >= elementTop) {
            setActiveId(tocItems[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tocItems]);

  // Handle click to scroll to section
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Offset from top
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h3 className="sidebar-title">Table of Contents</h3>
        <nav className="toc-nav">
          <ul className="toc-list">
            {tocItems.map((item) => (
              <li
                key={item.id}
                className={`toc-item toc-level-${item.level} ${
                  activeId === item.id ? "active" : ""
                }`}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className="toc-link"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
