import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  findPress3Object,
  getPress3State,
  subscribeToPress3Events,
} from "../services/press3";

interface Press3ContextValue {
  pages: Map<string, string>;
  isLoading: boolean;
  error: Error | null;
}

const Press3Context = createContext<Press3ContextValue | null>(null);

interface Press3ProviderProps {
  packageId: string;
  children: ReactNode;
}

export function Press3Provider({ packageId, children }: Press3ProviderProps) {
  const [pages, setPages] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial state
  useEffect(() => {
    let cancelled = false;

    async function fetchState() {
      try {
        const objectId = await findPress3Object(packageId);
        if (!objectId || cancelled) return;

        const state = await getPress3State(objectId);
        if (!state || cancelled) return;

        const pagesMap = new Map<string, string>();
        for (const page of state.pages) {
          pagesMap.set(page.path, page.walrus_id);
        }
        setPages(pagesMap);
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
  }, [packageId]);

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

  return (
    <Press3Context.Provider value={{ pages, isLoading, error }}>
      {children}
    </Press3Context.Provider>
  );
}

export function usePress3() {
  const context = useContext(Press3Context);
  if (!context) {
    throw new Error("usePress3 must be used within a Press3Provider");
  }
  return context;
}

export function usePress3Pages(): Map<string, string> {
  return usePress3().pages;
}
