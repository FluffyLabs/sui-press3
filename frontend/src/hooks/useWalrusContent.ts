import { useEffect, useState } from "react";
import { getFile } from "../services/walrus";

interface UseWalrusContentResult {
  content: Uint8Array | null;
  isLoading: boolean;
  error: Error | null;
}

export function useWalrusContent(
  walrusId: string | null,
): UseWalrusContentResult {
  const [content, setContent] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!walrusId) {
      return;
    }

    let cancelled = false;
    // Reset state at the start of fetching - this is intentional
    setContent(null); // eslint-disable-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    getFile(walrusId)
      .then((data) => {
        if (!cancelled) {
          setContent(data);
          setIsLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [walrusId]);

  return { content, isLoading, error };
}
