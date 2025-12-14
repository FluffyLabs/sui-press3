import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getPress3State, subscribeToPress3Events } from "../services/press3";
import { getFile } from "../services/walrus";

interface Press3ContextValue {
  pages: Map<string, string>;
  isLoading: boolean;
  error: Error | null;
  packageId: string;
  admins: string[];
  press3ObjectId: string;
  getPageWithIndex: (
    path: string,
  ) => { walrusId: string; index: number; editors: string[] } | null;
}

const Press3Context = createContext<Press3ContextValue | null>(null);

interface Press3ProviderProps {
  packageId: string;
  objectId: string;
  children: ReactNode;
}

export function Press3Provider({
  packageId,
  objectId,
  children,
}: Press3ProviderProps) {
  const [pages, setPages] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [pageRecords, setPageRecords] = useState<
    Array<{ path: string; walrusId: string; editors: string[] }>
  >([]);

  // Fetch initial state
  useEffect(() => {
    let cancelled = false;

    async function fetchState() {
      try {
        if (cancelled) return;

        const state = await getPress3State(objectId);
        if (!state || cancelled) return;

        const pagesMap = new Map<string, string>();
        for (const page of state.pages) {
          pagesMap.set(page.path, page.walrusId);
        }
        setPages(pagesMap);
        setAdmins(state.admins);
        setPageRecords(state.pages);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    fetchState();
    return () => {
      cancelled = true;
    };
  }, [objectId]);

  // Subscribe to events
  useEffect(() => {
    const subscription = subscribeToPress3Events(
      packageId,
      (event) => {
        setPages((prev) => new Map(prev).set(event.path, event.walrus_id));
      },
      (event) => {
        setPages((prev) => new Map(prev).set(event.path, event.new_walrus_id));
      },
    );

    return () => {
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, [packageId]);

  // Prefetch all pages in background
  useEffect(() => {
    if (pages.size === 0) return;

    const prefetchAll = async () => {
      for (const walrusId of pages.values()) {
        await getFile(walrusId);
      }
    };

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => prefetchAll());
      return () => cancelIdleCallback(id);
    }
    const timeout = setTimeout(prefetchAll, 100);
    return () => clearTimeout(timeout);
  }, [pages]);

  const getPageWithIndex = (path: string) => {
    const index = pageRecords.findIndex((p) => p.path === path);
    if (index === -1) return null;
    return {
      walrusId: pageRecords[index].walrusId,
      index,
      editors: pageRecords[index].editors,
    };
  };

  return (
    <Press3Context.Provider
      value={{
        pages,
        isLoading,
        error,
        packageId,
        admins,
        press3ObjectId: objectId,
        getPageWithIndex,
      }}
    >
      {children}
    </Press3Context.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePress3() {
  const context = useContext(Press3Context);
  if (!context) {
    throw new Error("usePress3 must be used within a Press3Provider");
  }
  return context;
}
