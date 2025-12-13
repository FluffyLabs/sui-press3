import { Transaction } from "@mysten/sui/transactions";

/**
 * Builds a transaction to update a page's Walrus ID in the smart contract.
 *
 * @param packageId - The package ID of the deployed contract
 * @param press3ObjectId - The shared Press3 object ID
 * @param pageIndex - The index of the page in the pages vector
 * @param pagePath - The path of the page (for assertion in contract)
 * @param newWalrusId - The new Walrus blob ID
 * @returns Transaction object ready to be signed
 */
export function buildUpdatePageTransaction(
  packageId: string,
  press3ObjectId: string,
  pageIndex: number,
  pagePath: string,
  newWalrusId: string,
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::press3::update_page_walrus_id`,
    arguments: [
      tx.object(press3ObjectId), // Shared Press3 object
      tx.pure.u64(pageIndex), // Page index in vector
      tx.pure.string(pagePath), // Page path for validation
      tx.pure.string(newWalrusId), // New Walrus blob ID
    ],
  });

  return tx;
}
