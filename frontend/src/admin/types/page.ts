export type Page = {
  id: string; // Internal ID for UI routing
  path: string; // From PageRecord.path
  walrusId: string; // From PageRecord.walrus_id (current blob)
  editors: string[]; // From PageRecord.editors (vector<address>)
  registeredAtBlock: number; // Block when page was first registered
  updatedAtBlock: number; // Block when page was last updated
  previousWalrusId: string | null; // Previous walrus blob id (null if no previous version)
  content?: string; // Fetched content (not from contract)
};
