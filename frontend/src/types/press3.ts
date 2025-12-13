/**
 * Shared types for Press3 contract data
 */

export interface PageRecord {
  path: string;
  walrusId: string;
  editors: string[];
}

export interface EnrichedPage extends PageRecord {
  id: string; // Generated from path for UI purposes
  registeredAtBlock?: number;
  updatedAtBlock?: number;
  previousWalrusId?: string | null;
}

export interface Press3State {
  objectId: string;
  admins: string[];
  pages: PageRecord[];
}
