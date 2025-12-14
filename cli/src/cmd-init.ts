import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DEFAULT_CONFIG, PRESS3_CONF_NAME, type Press3Config } from './config';
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
import { fileExists } from './utils';
import { loadPublisherKeypair } from './walrus';

export async function handleInit(flags: Record<string, string | boolean>) {
  if (await fileExists(PRESS3_CONF_NAME)) {
    logStep('Init', `Project already initialized. Check ${PRESS3_CONF_NAME}`);
    process.exit(1);
  }

  const outputPath = (flags.output as string) || PRESS3_CONF_NAME;
  const homepageBlobId = flags.home as string | undefined;
  const isDemo = flags.demo as boolean | undefined;

  const config = DEFAULT_CONFIG;
  logStep('Init', `Initializing Press3 on ${config.walrus.network}`);

  if (!isDemo && !homepageBlobId) {
    logStep('Init', `Homepage Blob ID is required, and not provided`);
    process.exit(1);
  }

  const signer = await loadPublisherKeypair(config.walrus.secret);

  // Step 1: Build and publish smart contract
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
    // Step 2: Register demo pages with Walrus blob
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
    if (!homepageBlobId) {
      logStep('Init', `Homepage Blob ID is required, and not provided`);
      process.exit(1);
    }

    // Step 2: Register homepage with Walrus blob
    logStep('Init', 'Registering homepage...');
    const registerResult = await registerPage({
      client: suiClient,
      signer,
      packageId,
      press3ObjectId,
      pagePath: '/',
      walrusId: homepageBlobId,
    });

    logStep(
      'Init',
      `Homepage registered successfully!\n` +
        `  Transaction: ${getSuiscanUrl(config.walrus.network, registerResult.digest)}`
    );
  }

  // Step 3: Write config file
  const initConfig: Press3Config = {
    package_id: packageId,
    press3_object_id: press3ObjectId,
    network: config.walrus.network,
  };

  await writeLogFile(outputPath, initConfig);
  logStep('Init', `Configuration saved to ${outputPath}`);

  // Step 4: Write frontend .env file
  const frontendDir = path.join(process.cwd(), '../frontend');
  const frontendEnvPath = path.join(frontendDir, '.env');

  try {
    // Check if frontend directory exists
    await fs.access(frontendDir);
    await writeFrontendEnvFile(frontendEnvPath, packageId, press3ObjectId);
    logStep('Init', `Frontend environment file created at ${frontendEnvPath}`);
  } catch (_error) {
    // Frontend directory doesn't exist or not accessible
    logStep('Init', 'Frontend directory not found, skipping .env creation');
  }

  // Summary
  console.log('\n=== Press3 Initialization Complete ===');
  console.log(`Network: ${config.walrus.network}`);
  console.log(`Package ID: ${packageId}`);
  console.log(`Press3 Object: ${press3ObjectId}`);
  console.log(`Config File: ${outputPath}`);
  console.log(`Frontend Env: ${frontendEnvPath} (if frontend/ exists)`);
  console.log('=====================================\n');
}

async function writeLogFile(path: string, config: Press3Config) {
  const content = `# Press3 Configuration
# Generated by: press3 init

# Smart contract package ID
package_id: ${config.package_id}

# Press3 shared object ID
press3_object_id: ${config.press3_object_id}

# Network (testnet or mainnet)
network: ${config.network}
`;

  await fs.writeFile(path, content, 'utf-8');
}

async function writeFrontendEnvFile(
  envPath: string,
  packageId: string,
  objectId: string
) {
  const content = `# Press3 Frontend Environment Variables
# Generated by: press3 init

# Smart contract package ID
VITE_PRESS3_PACKAGE_ID=${packageId}

# Press3 shared object ID
VITE_PRESS3_OBJECT_ID=${objectId}
`;

  await fs.writeFile(envPath, content, 'utf-8');
}
