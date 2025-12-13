import { join } from 'node:path';
import type { WalrusNetwork } from './config';
import { DEFAULT_CONFIG } from './config';
import { logStep } from './logger';
import {
  buildMoveContract,
  createSuiClient,
  extractPackageId,
  getSuiscanUrl,
  publishMovePackage,
  publishMovePackageWithCli,
  readCompiledModules,
  readPackageDependencies,
  type SuiPublishResult,
} from './sui';
import { loadPublisherKeypair } from './walrus';

const CONTRACT_PACKAGE_NAME = 'contract';

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
  await buildMoveContract(contractDir);
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
    const result = await publishMovePackageWithCli(contractDir);
    displayPublishResult(result, network);
    return;
  }

  logStep('Contract', 'Publishing using SDK...');
  const signer = await loadPublisherKeypair(config.walrus.secret);
  logStep('Contract', `Using signer: ${signer.toSuiAddress()}`);

  const client = createSuiClient(network);
  const modules = await readCompiledModules(contractDir, CONTRACT_PACKAGE_NAME);
  const dependencies = await readPackageDependencies(
    contractDir,
    CONTRACT_PACKAGE_NAME
  );

  logStep('Contract', `Found ${modules.length} module(s) to publish`);
  if (dependencies.length > 0) {
    logStep('Contract', `Dependencies: ${dependencies.join(', ')}`);
  }

  const result = await publishMovePackage({
    client,
    signer,
    modules,
    dependencies,
  });
  displayPublishResult(result, network);
}

function displayPublishResult(
  result: SuiPublishResult,
  network: WalrusNetwork
) {
  const packageId = extractPackageId(result);
  const suiscanUrl = getSuiscanUrl(network, result.digest);

  logStep('Contract', 'Contract published successfully');
  console.log(`Package ID: ${packageId}`);
  console.log(`Transaction: ${suiscanUrl}`);
}
