import { getFullnodeUrl } from "@mysten/sui/client";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import {
  type WalrusClient,
  walrus,
  WalrusFile,
  type WriteFilesFlow,
} from "@mysten/walrus";
import type { Transaction } from "@mysten/sui/transactions";
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

let walrusClient: WalrusClient | null = null;
const contentCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

export function getWalrusClient() {
  if (!walrusClient) {
    walrusClient = new SuiJsonRpcClient({
      url: getFullnodeUrl("testnet"),
      // Setting network on your client is required for walrus to work correctly
      network: "testnet",
    }).$extend(walrus({
      wasmUrl: walrusWasmUrl
    })).walrus;
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
 * Creates a Walrus upload flow for browser environments.
 * The flow must be executed in multiple steps with user interaction for wallet signing.
 *
 * @param content - The content to upload
 * @param path - The path identifier for the content (e.g., "/" or "/page.html")
 * @returns WriteFilesFlow object with methods for each step
 */
export function createWalrusUploadFlow(
  content: string,
  path: string,
): WriteFilesFlow {
  const client = getWalrusClient();
  const contentBytes = new TextEncoder().encode(content);

  const walrusFile = WalrusFile.from({
    contents: contentBytes,
    identifier: path,
    tags: { "content-type": "text/html" },
  });

  const flow = client.writeFilesFlow({
    files: [walrusFile],
  });

  return flow;
}

/**
 * Simplified upload function that orchestrates the full Walrus upload flow.
 * This handles all the steps: encode, register, upload, certify.
 *
 * @param content - The content to upload
 * @param path - The path identifier for the content
 * @param owner - The owner address (wallet address)
 * @param epochs - Number of epochs to store (default: 100)
 * @param signAndExecute - Function to sign and execute transactions
 * @param onCertifyStart - Optional callback when certify step starts
 * @returns Object with blob ID and transaction digests
 */
export async function uploadContent(
  content: string,
  path: string,
  owner: string,
  epochs: number,
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>,
  onCertifyStart?: () => void,
): Promise<{ blobId: string; registerDigest: string; certifyDigest: string }> {
  const flow = createWalrusUploadFlow(content, path);

  // Step 1: Encode the flow
  await flow.encode();

  // Step 2: Register the blob (requires wallet signature)
  const registerTx = flow.register({
    epochs,
    owner,
    deletable: true,
  });
  // Set gas budget for register transaction (1 SUI = 1_000_000_000 MIST)
  registerTx.setGasBudget(1_000_000_000);
  const { digest: registerDigest } = await signAndExecute(registerTx);

  // Step 3: Upload the data to storage nodes
  await flow.upload({ digest: registerDigest });

  // Step 4: Certify the blob (requires wallet signature)
  onCertifyStart?.();
  const certifyTx = flow.certify();
  // Set gas budget for certify transaction (0.1 SUI = 100_000_000 MIST)
  certifyTx.setGasBudget(100_000_000);
  const { digest: certifyDigest } = await signAndExecute(certifyTx);

  // Step 5: Get the uploaded files and extract blob ID
  const files = await flow.listFiles();
  const blobId = files[0]?.blobId;

  if (!blobId) {
    throw new Error("Failed to get blob ID from Walrus upload");
  }

  return { blobId, registerDigest, certifyDigest };
}
