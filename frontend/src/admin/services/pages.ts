import { fetchEnrichedPages } from "../../services/enrichedPages";
import type { Page } from "../types/page";

/**
 * Fetches all pages from the contract with enriched metadata
 */
export async function fetchPages(packageId: string): Promise<Page[]> {
  return fetchEnrichedPages(packageId);
}

/**
 * Fetches a single page by ID
 */
export async function fetchPageById(
  packageId: string,
  id: string,
): Promise<Page | null> {
  const pages = await fetchEnrichedPages(packageId);
  return pages.find((page) => page.id === id) || null;
}

/**
 * Updates a page (placeholder - actual implementation would submit transaction to blockchain)
 */
export async function updatePage(
  _packageId: string,
  id: string,
  updates: Partial<Page>,
): Promise<Page> {
  // TODO: Implement actual blockchain transaction to update page
  // For now, just return the updates merged with a placeholder
  throw new Error(
    `Update page not yet implemented. Would update page ${id} with: ${JSON.stringify(updates)}`,
  );
}
