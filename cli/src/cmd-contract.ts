import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { WalrusNetwork } from './config';
import { DEFAULT_CONFIG } from './config';
import { logStep } from './logger';
import { loadPublisherKeypair } from './walrus';

export async function handleContract(flags: Record<string, string | boolean>) {
  const dryRun = Boolean(flags['dry-run']);
  const useSdk = Boolean(flags['use-sdk']);
  const contractDir = join(import.meta.dir, '../../contract');

  const config = DEFAULT_CONFIG;
  const network = config.walrus.network;
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

  if (!useSdk) {
    logStep(
      'Contract',
      'Publishing using sui CLI. As an alternative use --use-sdk'
    );
    await publishWithCli(contractDir, network);
    return;
  }

  logStep('Contract', 'Publishing using SDK...');
  await publishWithSdk(contractDir, network, config.walrus.secret);
}

async function publishWithCli(contractDir: string, network: WalrusNetwork) {
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

async function publishWithSdk(
  contractDir: string,
  network: WalrusNetwork,
  secret: string
) {
  const signer = await loadPublisherKeypair(secret);
  logStep('Contract', `Using signer: ${signer.toSuiAddress()}`);

  const client = new SuiClient({ url: getFullnodeUrl(network) });

  // Read compiled modules from build directory
  const buildDir = join(contractDir, 'build/contract/bytecode_modules');
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

  logStep('Contract', `Found ${modules.length} module(s) to publish`);

  // Create publish transaction
  const tx = new Transaction();
  const upgradeCap = tx.publish({
    modules,
    dependencies: [],
  });
  tx.transferObjects([upgradeCap], tx.pure.address(signer.toSuiAddress()));

  // Execute transaction
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  const digest = result.digest;
  const packageId = extractPackageIdFromSdk(result);

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

interface SdkPublishResult {
  digest: string;
  objectChanges?: Array<{
    type: string;
    packageId?: string;
  }> | null;
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

function extractPackageIdFromSdk(result: SdkPublishResult): string {
  // The package ID is in the objectChanges array with type "published"
  const published = result.objectChanges?.find(
    (change: { type: string; packageId?: string }) =>
      change.type === 'published'
  );

  if (!published?.packageId) {
    throw new Error('Could not find published package in transaction result');
  }

  return published.packageId;
}

function getSuiscanUrl(network: WalrusNetwork, digest: string): string {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}
