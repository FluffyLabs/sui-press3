import type { Transaction } from "@mysten/sui/transactions";
import { buildUpdatePageTransaction } from "../../services/contract";
import { uploadContent } from "../../services/walrus";

export type SaveStep = "registering" | "certifying" | "updating" | "success";

export const SaveStep = {
  REGISTERING: "registering" as SaveStep,
  CERTIFYING: "certifying" as SaveStep,
  UPDATING: "updating" as SaveStep,
  SUCCESS: "success" as SaveStep,
};

export interface SaveResult {
  success: boolean;
  transactionDigest?: string;
  newWalrusId?: string;
  walrusRegisterDigest?: string;
  walrusCertifyDigest?: string;
  error?: Error;
  failedStep?: SaveStep;
}

export interface SavePageContentOptions {
  packageId: string;
  press3ObjectId: string;
  pageIndex: number;
  pagePath: string;
  content: string;
  owner: string;
  onProgress: (step: SaveStep) => void;
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>;
  epochs: number;
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
    owner,
    onProgress,
    signAndExecute,
    epochs,
  } = options;

  try {
    // Step 1: Register to Walrus
    onProgress(SaveStep.REGISTERING);

    // Step 2: Certify to Walrus (callback will be called from uploadContent)
    const {
      blobId: newWalrusId,
      registerDigest,
      certifyDigest,
    } = await uploadContent(
      content,
      pagePath,
      owner,
      epochs,
      signAndExecute,
      () => onProgress(SaveStep.CERTIFYING),
    );

    // Step 3: Update CMS contract
    onProgress(SaveStep.UPDATING);
    const tx = buildUpdatePageTransaction(
      packageId,
      press3ObjectId,
      pageIndex,
      pagePath,
      newWalrusId,
    );

    const result = await signAndExecute(tx);

    // Step 4: Success
    onProgress(SaveStep.SUCCESS);

    return {
      success: true,
      transactionDigest: result.digest,
      newWalrusId,
      walrusRegisterDigest: registerDigest,
      walrusCertifyDigest: certifyDigest,
    };
  } catch (error) {
    // Determine which step failed based on progress
    let failedStep = SaveStep.REGISTERING;
    let errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific Walrus errors
    if (
      errorMessage.includes("reserve_space") &&
      errorMessage.includes("0x2")
    ) {
      errorMessage =
        "Insufficient SUI balance to pay for Walrus storage. Please ensure you have enough SUI in your wallet to cover storage costs for the specified epochs.";
      failedStep = SaveStep.REGISTERING;
    } else if (errorMessage.includes("certify")) {
      failedStep = SaveStep.CERTIFYING;
    } else if (
      errorMessage.includes("wallet") ||
      errorMessage.includes("signature") ||
      errorMessage.includes("rejected")
    ) {
      // Could be any step requiring wallet signature
      failedStep = SaveStep.UPDATING;
    } else if (errorMessage.includes("transaction")) {
      failedStep = SaveStep.UPDATING;
    }

    return {
      success: false,
      error: new Error(errorMessage),
      failedStep,
    };
  }
}
