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
  console.log("blob", blob);
  console.log("files", files.map((x) => x.text()));
  const [file] = await client.getFiles({ ids: [blobId] });
  return file.text();
}
