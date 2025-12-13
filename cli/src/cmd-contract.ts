import { join } from 'node:path';
import type { WalrusNetwork } from './config';
import { DEFAULT_CONFIG } from './config';
import { logStep } from './logger';

export async function handleContract(flags: Record<string, string | boolean>) {
  const dryRun = Boolean(flags['dry-run']);
  const contractDir = join(import.meta.dir, '../../contract');

  const network = DEFAULT_CONFIG.walrus.network;
  logStep(
    'Contract',
    `Building and publishing contract from ${contractDir} to ${network} ${dryRun ? '(dry-run)' : ''}`
  );

  // Build the contract
  logStep('Contract', 'Building Move contract...');
  const buildResult = await Bun.$`sui move build`.cwd(contractDir).quiet();

  if (buildResult.exitCode !== 0) {
    throw new Error(
      `Failed to build contract: ${buildResult.stderr.toString()}`
    );
  }

  logStep('Contract', 'Build successful');

  if (dryRun) {
    logStep('Contract', 'Dry run enabled, skipping publish');
    return;
  }

  // Publish the contract
  logStep('Contract', 'Publishing to SUI network...');
  const publishResult =
    await Bun.$`sui client publish --json --skip-dependency-verification`
      .cwd(contractDir)
      .quiet();

  if (publishResult.exitCode !== 0) {
    throw new Error(
      `Failed to publish contract: ${publishResult.stderr.toString()}`
    );
  }

  // Parse the JSON output
  const output = JSON.parse(publishResult.stdout.toString()) as PublishOutput;
  const digest = output.digest;
  const packageId = extractPackageId(output);

  const suiscanUrl = getSuiscanUrl(network, digest);

  logStep('Contract', 'Contract published successfully');
  console.log(`Package ID: ${packageId}`);
  console.log(`Transaction: ${suiscanUrl}`);
}

interface PublishOutput {
  digest: string;
  objectChanges?: Array<{
    type: string;
    packageId?: string;
  }>;
}

function extractPackageId(output: PublishOutput): string {
  // The package ID is in the objectChanges array with type "published"
  const published = output.objectChanges?.find(
    (change) => change.type === 'published'
  );

  if (!published?.packageId) {
    throw new Error('Could not find published package in transaction output');
  }

  return published.packageId;
}

function getSuiscanUrl(network: WalrusNetwork, digest: string): string {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}
