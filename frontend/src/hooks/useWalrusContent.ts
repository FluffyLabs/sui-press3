import { useEffect, useState } from "react";
import { getCachedBlob, getFile } from "../services/walrus";

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
    let cancelled = false;

    if (!walrusId) {
      // Queue state updates asynchronously to avoid cascading renders
      queueMicrotask(() => {
        if (!cancelled) {
          setContent(null);
          setIsLoading(false);
          setError(null);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    const cachedContent = getCachedBlob(walrusId);
    const shouldRefresh = Boolean(cachedContent);

    // Queue initial state updates asynchronously
    queueMicrotask(() => {
      if (!cancelled) {
        setContent(cachedContent);
        setIsLoading(!cachedContent);
        setError(null);
      }
    });

    getFile(walrusId, { refresh: shouldRefresh })
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
