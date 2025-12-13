import { useEffect, useState } from "react";
import { getFile } from "../services/walrus";

interface UseWalrusContentResult {
  content: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useWalrusContent(
  walrusId: string | null,
): UseWalrusContentResult {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!walrusId) {
      setContent(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
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
