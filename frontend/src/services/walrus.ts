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
