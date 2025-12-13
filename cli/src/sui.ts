import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import type { SuiNetwork } from './config';
import type { PageRecord, Press3Record } from './types';

export interface SuiObjectChange {
  type: string;
  packageId?: string;
  objectId?: string;
  objectType?: string;
}

export interface SuiPublishResult {
  digest: string;
  objectChanges?: Array<SuiObjectChange> | null;
}

/**
 * Create a SUI client for the specified network
 */
export function createSuiClient(network: SuiNetwork): SuiClient {
  return new SuiClient({ url: getFullnodeUrl(network) });
}

/**
 * Extract the package ID from a publish transaction result
 */
export function extractPackageId(result: SuiPublishResult): string {
  const published = result.objectChanges?.find(
    (change) => change.type === 'published'
  );

  if (!published?.packageId) {
    throw new Error('Could not find published package in transaction result');
  }

  return published.packageId;
}

/**
 * Extract the Press3 shared object ID from a publish transaction result
 */
export function extractPress3ObjectId(result: SuiPublishResult): string {
  const created = result.objectChanges?.find(
    (change) =>
      change.type === 'created' &&
      change.objectType?.includes('::press3::Press3')
  );

  if (!created?.objectId) {
    throw new Error(
      'Could not find Press3 shared object in transaction result'
    );
  }

  return created.objectId;
}

/**
 * Generate a Suiscan URL for a transaction
 */
export function getSuiscanUrl(network: SuiNetwork, digest: string): string {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}

/**
 * Build a Move contract using the sui CLI
 */
export async function buildMoveContract(contractDir: string): Promise<void> {
  const buildResult = await Bun.$`sui move build`.cwd(contractDir).quiet();

  if (buildResult.exitCode !== 0) {
    throw new Error(
      `Failed to build contract: ${buildResult.stderr.toString()}`
    );
  }
}

/**
 * Read compiled Move modules from the build directory
 */
export async function readCompiledModules(
  contractDir: string,
  packageName: string
): Promise<number[][]> {
  const buildDir = join(contractDir, `build/${packageName}/bytecode_modules`);
  const moduleFiles = await fs.readdir(buildDir);

  const modules = await Promise.all(
    moduleFiles
      .filter((file) => file.endsWith('.mv'))
      .map(async (file) => {
        const modulePath = join(buildDir, file);
        const moduleBytes = await fs.readFile(modulePath);
        return Array.from(moduleBytes);
      })
  );

  if (modules.length === 0) {
    throw new Error('No compiled modules found in build directory');
  }

  return modules;
}

/**
 * Read package dependencies from BuildInfo.yaml
 * Returns well-known framework package IDs
 */
export async function readPackageDependencies(
  contractDir: string,
  packageName: string
): Promise<string[]> {
  try {
    const buildInfoPath = join(
      contractDir,
      `build/${packageName}/BuildInfo.yaml`
    );
    const buildInfoContent = await fs.readFile(buildInfoPath, 'utf-8');

    // Parse dependencies from YAML
    // For framework packages, we use well-known IDs
    const dependencies: string[] = [];

    if (buildInfoContent.includes('MoveStdlib')) {
      dependencies.push('0x1');
    }
    if (
      buildInfoContent.includes('Sui:') ||
      buildInfoContent.includes('sui:')
    ) {
      dependencies.push('0x2');
    }
    if (buildInfoContent.includes('SuiSystem')) {
      dependencies.push('0x3');
    }

    return dependencies;
  } catch (_error) {
    // If we can't read dependencies, return empty array
    // The SDK will handle framework dependencies automatically
    return [];
  }
}

/**
 * Publish a Move package using the SUI SDK
 */
export async function publishMovePackage(options: {
  client: SuiClient;
  signer: Ed25519Keypair;
  modules: number[][];
  dependencies: string[];
}): Promise<SuiPublishResult> {
  const { client, signer, modules, dependencies } = options;

  const tx = new Transaction();
  const upgradeCap = tx.publish({
    modules,
    dependencies,
  });
  tx.transferObjects([upgradeCap], tx.pure.address(signer.toSuiAddress()));

  // Set a reasonable gas budget
  tx.setGasBudget(100_000_000); // 0.1 SUI

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  return result;
}

/**
 * Publish a Move package using the sui CLI
 */
export async function publishMovePackageWithCli(
  contractDir: string
): Promise<SuiPublishResult> {
  const publishResult =
    await Bun.$`sui client publish --json --skip-dependency-verification`
      .cwd(contractDir)
      .quiet();

  if (publishResult.exitCode !== 0) {
    throw new Error(
      `Failed to publish contract: ${publishResult.stderr.toString()}`
    );
  }

  return JSON.parse(publishResult.stdout.toString()) as SuiPublishResult;
}

/**
 * Wait for a package to be indexed on the fullnode
 */
async function waitForPackage(
  client: SuiClient,
  packageId: string,
  maxRetries = 10,
  delayMs = 1000
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.getObject({ id: packageId });
      return;
    } catch (_error) {
      if (i === maxRetries - 1) {
        throw new Error(
          `Package ${packageId} not indexed after ${maxRetries} retries`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Register the page with a walrus_id
 */
export async function registerPage(options: {
  client: SuiClient;
  signer: Ed25519Keypair;
  packageId: string;
  press3ObjectId: string;
  pagePath: string;
  walrusId: string;
}): Promise<SuiPublishResult> {
  const { client, signer, packageId, press3ObjectId, pagePath, walrusId } =
    options;

  // Wait for the package to be indexed before calling Move functions
  await waitForPackage(client, packageId);

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::press3::register_page`,
    arguments: [
      tx.object(press3ObjectId),
      tx.pure.string(pagePath),
      tx.pure.string(walrusId),
    ],
  });

  tx.setGasBudget(10_000_000); // 0.01 SUI

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  return result;
}

/**
 * Fetch all pages from a Press3 object
 */
export async function getPages(options: {
  client: SuiClient;
  press3ObjectId: string;
}): Promise<PageRecord[]> {
  const { client, press3ObjectId } = options;

  const object = await client.getObject({
    id: press3ObjectId,
    options: {
      showContent: true,
    },
  });

  if (!object.data?.content || object.data.content.dataType !== 'moveObject') {
    throw new Error('Invalid Press3 object');
  }

  const fields = object.data.content.fields as unknown as Press3Record;
  const pages = fields.pages || [];

  return pages.map((page) => ({
    path: page.fields.path,
    walrus_id: page.fields.walrus_id,
    editors: page.fields.editors || [],
  }));
}

/**
 * Update page with a walrus_id
 */
export async function updatePage(options: {
  client: SuiClient;
  signer: Ed25519Keypair;
  packageId: string;
  press3ObjectId: string;
  pageIndex: number;
  pagePath: string;
  walrusId: string;
}): Promise<SuiPublishResult> {
  const {
    client,
    signer,
    packageId,
    press3ObjectId,
    pageIndex,
    pagePath,
    walrusId,
  } = options;

  // Wait for the package to be indexed before calling Move functions
  await waitForPackage(client, packageId);

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::press3::update_page_walrus_id`,
    arguments: [
      tx.object(press3ObjectId),
      tx.pure.u64(pageIndex),
      tx.pure.string(pagePath),
      tx.pure.string(walrusId),
    ],
  });

  tx.setGasBudget(10_000_000); // 0.01 SUI

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  return result;
}
