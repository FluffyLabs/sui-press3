import type { EnrichedPage } from "../types/press3";
import { getPress3State, queryPageEvents } from "./press3";

/**
 * Fetches pages from the contract and enriches them with event history data
 */
export async function fetchEnrichedPages(
  packageId: string,
  objectId: string,
): Promise<{ pages: EnrichedPage[]; admins: string[] }> {
  // Get current state
  const state = await getPress3State(objectId);
  if (!state) {
    throw new Error("Failed to fetch Press3 state");
  }

  // Query events for additional metadata
  const events = await queryPageEvents(packageId);

  // Build a map of path -> event data
  const eventsByPath = new Map<
    string,
    {
      registeredAtBlock?: number;
      updatedAtBlock?: number;
      previousWalrusId?: string;
    }
  >();

  for (const event of events) {
    const existing = eventsByPath.get(event.path) || {};

    if (event.type === "registered") {
      existing.registeredAtBlock = event.timestamp
        ? parseInt(event.timestamp, 10)
        : undefined;
    } else if (event.type === "updated") {
      existing.updatedAtBlock = event.timestamp
        ? parseInt(event.timestamp, 10)
        : undefined;
      existing.previousWalrusId = event.old_walrus_id;
    }

    eventsByPath.set(event.path, existing);
  }

  // Enrich pages with event data
  const pages = state.pages.map((page) => {
    const eventData = eventsByPath.get(page.path) || {};
    return {
      id: generatePageId(page.path),
      path: page.path,
      walrusId: page.walrusId,
      editors: page.editors,
      registeredAtBlock: eventData.registeredAtBlock,
      updatedAtBlock: eventData.updatedAtBlock,
      previousWalrusId: eventData.previousWalrusId,
    };
  });

  return {
    pages,
    admins: state.admins,
  };
}

/**
 * Generates a stable ID from a path for UI purposes
 */
function generatePageId(path: string): string {
  // Special case for root path
  if (path === "/" || path === "") {
    return "index";
  }

  // Simple hash function - could use a proper hash if needed
  return path.replace(/[^a-zA-Z0-9]/g, "-").replace(/^-+|-+$/g, "");
}
