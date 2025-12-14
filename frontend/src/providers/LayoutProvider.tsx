import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getFile } from "../services/walrus";
import { type PageLayout, tryParsePageLayout } from "../types";
import { usePress3 } from "./Press3Provider";

interface LayoutContextValue {
  layout: PageLayout | null;
  rawContent: string | null;
  isLoading: boolean;
  error: Error | null;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

interface Props {
  children: ReactNode;
}

export function LayoutProvider({ children }: Props) {
  const { pages, isLoading: isLoadingPages } = usePress3();
  const [layout, setLayout] = useState<PageLayout | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoadingPages) return;

    const rootWalrusId = pages.get("/");
    if (!rootWalrusId) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    let cancelled = false;

    getFile(rootWalrusId)
      .then((content) => {
        if (cancelled) return;
        const parsed = tryParsePageLayout(content);
        if (parsed) {
          setLayout(parsed);
        } else {
          setRawContent(content);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pages, isLoadingPages]);

  return (
    <LayoutContext.Provider value={{ layout, rawContent, isLoading, error }}>
      {children}
    </LayoutContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
