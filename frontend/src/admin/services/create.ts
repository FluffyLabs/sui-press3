import type { Transaction } from "@mysten/sui/transactions";
import { buildRegisterPageTransaction } from "../../services/contract";
import { uploadContent } from "../../services/walrus";
import type { SaveStep } from "./save";
import { SaveStep as Step } from "./save";

export interface CreateResult {
  success: boolean;
  transactionDigest?: string;
  walrusId?: string;
  walrusRegisterDigest?: string;
  walrusCertifyDigest?: string;
  error?: Error;
  failedStep?: SaveStep;
}

export interface CreatePageContentOptions {
  packageId: string;
  press3ObjectId: string;
  pagePath: string;
  content: string;
  owner: string;
  onProgress: (step: SaveStep) => void;
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>;
  epochs?: number;
}

/**
 * Orchestrates the multi-step page creation process:
 * 1. Upload content to Walrus
 * 2. Register new page in smart contract
 *
 * @param options - Create configuration options
 * @returns Create result with success status and optional error
 */
export async function createPageContent(
  options: CreatePageContentOptions,
): Promise<CreateResult> {
  const {
    packageId,
    press3ObjectId,
    pagePath,
    content,
    owner,
    onProgress,
    signAndExecute,
    epochs = 5, // Default to 5 epochs (~30 days) for reasonable storage costs
  } = options;

  try {
    // Step 1: Register to Walrus
    onProgress(Step.REGISTERING);

    // Step 2: Certify to Walrus (callback will be called from uploadContent)
    const { blobId: walrusId, registerDigest, certifyDigest } =
      await uploadContent(
        content,
        pagePath,
        owner,
        epochs,
        signAndExecute,
        () => onProgress(Step.CERTIFYING)
      );

    // Step 3: Register page in CMS contract
    onProgress(Step.UPDATING);
    const tx = buildRegisterPageTransaction(
      packageId,
      press3ObjectId,
      pagePath,
      walrusId,
    );

    const result = await signAndExecute(tx);

    // Step 4: Success
    onProgress(Step.SUCCESS);

    return {
      success: true,
      transactionDigest: result.digest,
      walrusId,
      walrusRegisterDigest: registerDigest,
      walrusCertifyDigest: certifyDigest,
    };
  } catch (error) {
    // Determine which step failed based on progress
    let failedStep = Step.REGISTERING;
    let errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific errors
    if (errorMessage.includes("reserve_space") && errorMessage.includes("0x2")) {
      errorMessage =
        "Insufficient SUI balance to pay for Walrus storage. Please ensure you have enough SUI in your wallet to cover storage costs for the specified epochs.";
      failedStep = Step.REGISTERING;
    } else if (errorMessage.includes("assert_admin")) {
      errorMessage =
        "Only admins can create new pages. Please ensure you are connected with an admin account.";
      failedStep = Step.UPDATING;
    } else if (errorMessage.includes("certify")) {
      failedStep = Step.CERTIFYING;
    } else if (
      errorMessage.includes("wallet") ||
      errorMessage.includes("signature") ||
      errorMessage.includes("rejected")
    ) {
      failedStep = Step.UPDATING;
    } else if (errorMessage.includes("transaction")) {
      failedStep = Step.UPDATING;
    }

    return {
      success: false,
      error: new Error(errorMessage),
      failedStep,
    };
  }
}
