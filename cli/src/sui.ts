import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import type { WalrusNetwork } from './config';

export interface SuiPublishResult {
  digest: string;
  objectChanges?: Array<{
    type: string;
    packageId?: string;
  }> | null;
}

/**
 * Create a SUI client for the specified network
 */
export function createSuiClient(network: WalrusNetwork): SuiClient {
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
 * Generate a Suiscan URL for a transaction
 */
export function getSuiscanUrl(network: WalrusNetwork, digest: string): string {
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
