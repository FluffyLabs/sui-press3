import { fetchEnrichedPages } from "../../services/enrichedPages";
import type { Page } from "../types/page";

/**
 * Fetches all pages from the contract with enriched metadata
 */
export async function fetchPages(
  packageId: string,
  objectId: string,
): Promise<Page[]> {
  const { pages } = await fetchEnrichedPages(packageId, objectId);
  return pages;
}

/**
 * Fetches a single page by ID
 */
export async function fetchPageById(
  packageId: string,
  objectId: string,
  id: string,
): Promise<Page | null> {
  const { pages } = await fetchEnrichedPages(packageId, objectId);
  return pages.find((page) => page.id === id) || null;
}
