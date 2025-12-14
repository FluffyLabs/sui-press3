import { Transaction } from "@mysten/sui/transactions";
import {getSetEditors} from "../App";

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

  // Set gas budget (0.1 SUI = 100_000_000 MIST)
  tx.setGasBudget(100_000_000);

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

/**
 * Builds a transaction to update editors for a page. Only admins can call this.
 */
export function buildSetEditorsTransaction(
  packageId: string,
  press3ObjectId: string,
  pageIndex: number,
  pagePath: string,
  editors: string[],
): Transaction {
  const tx = new Transaction();

  tx.setGasBudget(100_000_000);

  tx.moveCall({
    target: `${packageId}::press3::${getSetEditors()}`,
    arguments: [
      tx.object(press3ObjectId),
      tx.pure.u64(pageIndex),
      tx.pure.string(pagePath),
      tx.pure.vector("address", editors),
    ],
  });

  return tx;
}

/**
 * Builds a transaction to register a new page in the smart contract.
 * Only admins can register new pages.
 *
 * @param packageId - The package ID of the deployed contract
 * @param press3ObjectId - The shared Press3 object ID
 * @param pagePath - The path of the new page
 * @param walrusId - The Walrus blob ID of the page content
 * @returns Transaction object ready to be signed
 */
export function buildRegisterPageTransaction(
  packageId: string,
  press3ObjectId: string,
  pagePath: string,
  walrusId: string,
): Transaction {
  const tx = new Transaction();

  // Set gas budget (0.1 SUI = 100_000_000 MIST)
  tx.setGasBudget(100_000_000);

  tx.moveCall({
    target: `${packageId}::press3::register_page`,
    arguments: [
      tx.object(press3ObjectId), // Shared Press3 object
      tx.pure.string(pagePath), // Page path
      tx.pure.string(walrusId), // Walrus blob ID
    ],
  });

  return tx;
}
