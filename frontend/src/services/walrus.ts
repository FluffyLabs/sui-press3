import { getFullnodeUrl } from "@mysten/sui/client";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { type WalrusClient, walrus } from "@mysten/walrus";

let walrusClient: WalrusClient | null = null;
const contentCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

export function getWalrusClient() {
  if (!walrusClient) {
    walrusClient = new SuiJsonRpcClient({
      url: getFullnodeUrl("testnet"),
      // Setting network on your client is required for walrus to work correctly
      network: "testnet",
    }).$extend(walrus()).walrus;
  }
  return walrusClient;
}

async function fetchFromWalrus(blobId: string): Promise<string> {
  const client = getWalrusClient();
  const blob = await client.getBlob({ blobId });
  const files = await blob.files();
  return files[0].text();
}

export async function getFile(blobId: string): Promise<string> {
  // Return from cache if exists
  const cached = contentCache.get(blobId);
  if (cached !== undefined) {
    return cached;
  }

  // Join existing request if in-flight
  const pending = pendingRequests.get(blobId);
  if (pending) {
    return pending;
  }

  // Make new request
  const promise = fetchFromWalrus(blobId);
  pendingRequests.set(blobId, promise);

  try {
    const content = await promise;
    contentCache.set(blobId, content);
    return content;
  } finally {
    pendingRequests.delete(blobId);
  }
}

/**
 * Uploads content to Walrus and returns the blob ID.
 *
 * Note: This is a simplified placeholder. In production, Walrus uploads
 * require proper transaction signing through the wallet. This will need
 * to be updated based on the actual Walrus browser SDK implementation.
 *
 * @param content - The content to upload
 * @param path - The path identifier for the content (e.g., "/" or "/page.html")
 * @param epochs - Number of epochs to store (default: 100)
 * @returns The blob ID of the uploaded content
 */
export async function uploadContent(
  _content: string,
  _path: string,
  _epochs?: number,
): Promise<string> {
  // TODO: Implement proper Walrus upload with wallet signing
  // For now, we'll throw an error indicating this needs wallet integration
  throw new Error(
    "Walrus upload in browser requires wallet integration - not yet fully implemented. Please use the CLI for uploads.",
  );
}
