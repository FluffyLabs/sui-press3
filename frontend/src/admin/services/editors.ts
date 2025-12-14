import type { Transaction } from "@mysten/sui/transactions";
import { buildSetEditorsTransaction } from "../../services/contract";

interface SetEditorsOptions {
  packageId: string;
  press3ObjectId: string;
  pageIndex: number;
  pagePath: string;
  editors: string[];
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>;
}

export async function setPageEditors({
  packageId,
  press3ObjectId,
  pageIndex,
  pagePath,
  editors,
  signAndExecute,
}: SetEditorsOptions) {
  const tx = buildSetEditorsTransaction(
    packageId,
    press3ObjectId,
    pageIndex,
    pagePath,
    editors,
  );

  return signAndExecute(tx);
}
