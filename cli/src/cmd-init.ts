import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_CONFIG } from './config';
import { logStep } from './logger';
import {
  buildMoveContract,
  createSuiClient,
  extractPackageId,
  extractPress3ObjectId,
  getSuiscanUrl,
  publishMovePackage,
  readCompiledModules,
  readPackageDependencies,
  registerPage,
} from './sui';
import { ensurePathExists } from './utils';
import {
  createWalrusClient,
  loadPublisherKeypair,
  prepareWalrusFiles,
} from './walrus';

interface InitConfig {
  walrus_id: string;
  package_id: string;
  press3_object_id: string;
  network: string;
}

export async function handleInit(flags: Record<string, string | boolean>) {
  const outputPath = (flags.output as string) || 'press3.init.log';
  const homepageBlobId = flags.home as string | undefined;
  const isDemo = flags.demo as boolean | undefined;

  const config = DEFAULT_CONFIG;
  logStep('Init', `Initializing Press3 on ${config.walrus.network}`);

  if (!isDemo && !homepageBlobId) {
    logStep('Init', `Homepage Blob ID is required, and not provided`);
    process.exit(1);
  }

  // Step 1: Build and deploy frontend to Walrus
  logStep('Init', 'Building frontend...');
  const quiltEntryPoint = join(config.frontendDir, config.quiltEntry);
  const quiltAssetsDir = join(config.frontendDir, config.quiltAssetsDir);

  await buildFrontend(config.frontendDir);
  await ensurePathExists(quiltEntryPoint, 'quilt entry point');

  const files = await prepareWalrusFiles({
    assetsDir: quiltAssetsDir,
    entryPath: quiltEntryPoint,
  });
  logStep('Init', `Bundled ${files.length} files from ${quiltAssetsDir}`);

  // Deploy to Walrus
  logStep('Init', 'Deploying frontend to Walrus...');
  const signer = await loadPublisherKeypair(config.walrus.secret);
  logStep('Init', `Using signer: ${signer.toSuiAddress()}`);

  const walrusClient = createWalrusClient(config.walrus.network);

  const patches = await walrusClient.walrus.writeFiles({
    files,
    epochs: config.walrus.epochs,
    deletable: config.walrus.deletable,
    signer,
  });

  if (!patches.length) {
    throw new Error('Walrus writeFiles returned zero patches.');
  }

  const walrusId = patches[0]?.blobId;
  if (!walrusId) {
    throw new Error('Failed to get blob ID from Walrus');
  }

  logStep(
    'Init',
    `Frontend deployed to Walrus: ${walrusId} (${patches.length} files)`
  );

  // Step 2: Build and publish smart contract
  logStep('Init', 'Building smart contract...');
  await buildMoveContract(config.contractDir);

  const modules = await readCompiledModules(config.contractDir, 'contract');
  const dependencies = await readPackageDependencies(
    config.contractDir,
    'contract'
  );

  logStep('Init', 'Publishing smart contract...');
  const suiClient = createSuiClient(config.walrus.network);

  const publishResult = await publishMovePackage({
    client: suiClient,
    signer,
    modules,
    dependencies,
  });

  const packageId = extractPackageId(publishResult);
  const press3ObjectId = extractPress3ObjectId(publishResult);

  logStep(
    'Init',
    `Contract published:\n` +
      `  Package ID: ${packageId}\n` +
      `  Press3 Object: ${press3ObjectId}\n` +
      `  Transaction: ${getSuiscanUrl(config.walrus.network, publishResult.digest)}`
  );

  if (isDemo) {
    // Step 3: Register demo pages with Walrus blob
    logStep('Init', 'Registering homepage...');
    const registerHomeResult = await registerPage({
      client: suiClient,
      signer,
      packageId,
      press3ObjectId,
      pagePath: '/',
      walrusId: 'Jr8pOhbySA3GEUQqSzcmxZEoOGgqY6gn-Kmo6-pkNvU',
    });

    logStep(
      'Init',
      `Homepage registered successfully!\n` +
        `  Transaction: ${getSuiscanUrl(config.walrus.network, registerHomeResult.digest)}`
    );

    logStep('Init', 'Registering index.html...');
    const registerIndexResult = await registerPage({
      client: suiClient,
      signer,
      packageId,
      press3ObjectId,
      pagePath: '/index.html',
      walrusId: 'Jr8pOhbySA3GEUQqSzcmxZEoOGgqY6gn-Kmo6-pkNvU',
    });

    logStep(
      'Init',
      `Index.html registered successfully!\n` +
        `  Transaction: ${getSuiscanUrl(config.walrus.network, registerIndexResult.digest)}`
    );

    logStep('Init', 'Registering article.md...');
    const registerArticleResult = await registerPage({
      client: suiClient,
      signer,
      packageId,
      press3ObjectId,
      pagePath: '/article.md',
      walrusId: '1uJVmO-79L9ZefNxKYJz8239OGFdNFgk9oXQZV5OBkg',
    });

    logStep(
      'Init',
      `Article.md registered successfully!\n` +
        `  Transaction: ${getSuiscanUrl(config.walrus.network, registerArticleResult.digest)}`
    );
  } else {
    // Step 3: Register homepage with Walrus blob
    logStep('Init', 'Registering homepage...');
    const registerResult = await registerPage({
      client: suiClient,
      signer,
      packageId,
      press3ObjectId,
      pagePath: '/',
      walrusId: homepageBlobId!,
    });

    logStep(
      'Init',
      `Homepage registered successfully!\n` +
        `  Transaction: ${getSuiscanUrl(config.walrus.network, registerResult.digest)}`
    );
  }

  // Step 4: Write config file
  const initConfig: InitConfig = {
    walrus_id: walrusId,
    package_id: packageId,
    press3_object_id: press3ObjectId,
    network: config.walrus.network,
  };

  await writeLogFile(outputPath, initConfig);
  logStep('Init', `Configuration saved to ${outputPath}`);

  // Summary
  console.log('\n=== Press3 Initialization Complete ===');
  console.log(`Network: ${config.walrus.network}`);
  console.log(`Package ID: ${packageId}`);
  console.log(`Press3 Object: ${press3ObjectId}`);
  console.log(`Walrus Blob: ${walrusId}`);
  console.log(`Config File: ${outputPath}`);
  console.log('=====================================\n');
}

async function buildFrontend(frontendDir: string) {
  await Bun.$`npm ci`.cwd(frontendDir);
  await Bun.$`npm run build`.cwd(frontendDir);
}

async function writeLogFile(path: string, config: InitConfig) {
  const content = `# Press3 Configuration
# Generated by: press3 init

# Frontend Walrus blob ID
walrus_id: ${config.walrus_id}

# Smart contract package ID
package_id: ${config.package_id}

# Press3 shared object ID
press3_object_id: ${config.press3_object_id}

# Network (testnet or mainnet)
network: ${config.network}
`;

  await fs.writeFile(path, content, 'utf-8');
}
