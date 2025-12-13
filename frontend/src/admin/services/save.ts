import type { Transaction } from "@mysten/sui/transactions";
import { buildUpdatePageTransaction } from "../../services/contract";
import { uploadContent } from "../../services/walrus";

export type SaveStep = "uploading" | "wallet" | "transaction" | "success";

export const SaveStep = {
  UPLOADING_WALRUS: "uploading" as SaveStep,
  WAITING_WALLET: "wallet" as SaveStep,
  SUBMITTING_TX: "transaction" as SaveStep,
  SUCCESS: "success" as SaveStep,
};

export interface SaveResult {
  success: boolean;
  transactionDigest?: string;
  newWalrusId?: string;
  error?: Error;
  failedStep?: SaveStep;
}

export interface SavePageContentOptions {
  packageId: string;
  press3ObjectId: string;
  pageIndex: number;
  pagePath: string;
  content: string;
  onProgress: (step: SaveStep) => void;
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>;
  epochs?: number;
}

/**
 * Orchestrates the multi-step save process:
 * 1. Upload content to Walrus
 * 2. Update smart contract with new Walrus ID
 *
 * @param options - Save configuration options
 * @returns Save result with success status and optional error
 */
export async function savePageContent(
  options: SavePageContentOptions,
): Promise<SaveResult> {
  const {
    packageId,
    press3ObjectId,
    pageIndex,
    pagePath,
    content,
    onProgress,
    signAndExecute,
    epochs = 100,
  } = options;

  try {
    // Step 1: Upload to Walrus
    onProgress(SaveStep.UPLOADING_WALRUS);
    const newWalrusId = await uploadContent(content, pagePath, epochs);

    // Step 2: Build and sign transaction
    onProgress(SaveStep.WAITING_WALLET);
    const tx = buildUpdatePageTransaction(
      packageId,
      press3ObjectId,
      pageIndex,
      pagePath,
      newWalrusId,
    );

    const result = await signAndExecute(tx);

    // Step 3: Transaction is being processed
    onProgress(SaveStep.SUBMITTING_TX);

    // Step 4: Success
    onProgress(SaveStep.SUCCESS);

    return {
      success: true,
      transactionDigest: result.digest,
      newWalrusId,
    };
  } catch (error) {
    // Determine which step failed based on progress
    let failedStep = SaveStep.UPLOADING_WALRUS;
    if (error instanceof Error) {
      if (
        error.message.includes("wallet") ||
        error.message.includes("signature") ||
        error.message.includes("rejected")
      ) {
        failedStep = SaveStep.WAITING_WALLET;
      } else if (error.message.includes("transaction")) {
        failedStep = SaveStep.SUBMITTING_TX;
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      failedStep,
    };
  }
}
