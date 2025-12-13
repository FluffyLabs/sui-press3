import { getFullnodeUrl } from "@mysten/sui/client";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { type WalrusClient, walrus } from "@mysten/walrus";

let walrusClient: WalrusClient | null = null;

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

export async function getFile(blobId: string): Promise<string> {
  const client = getWalrusClient();
  const blob = await client.getBlob({ blobId });
  const files = await blob.files();
  return files[0].text();
}
