import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import { WalrusFile } from '@mysten/walrus';
import { lookup as lookupMime } from 'mime-types';
import { DEFAULT_CONFIG, PRESS3_CONF_NAME, type Press3Config } from './config';
import { logStep } from './logger';
import {
  batchUpdateOrRegisterPages,
  createSuiClient,
  getPages,
  getSuiscanUrl,
} from './sui';
import { ensurePathExists } from './utils';
import { createWalrusClient, loadPublisherKeypair } from './walrus';

interface FileUploadResult {
  path: string;
  walrusId: string;
}

export async function handleBatchPublishUpdate(
  flags: Record<string, string | boolean>
) {
  const directoryPath = flags.dir as string;

  if (!directoryPath) {
    throw new Error('Missing required option: --dir');
  }

  await ensurePathExists(directoryPath, 'Directory');
  await ensurePathExists(PRESS3_CONF_NAME, 'Press3 config file');

  const { package_id: packageId, press3_object_id: press3ObjectId } =
    Bun.YAML.parse(await Bun.file(PRESS3_CONF_NAME).text()) as Press3Config;

  const config = DEFAULT_CONFIG;
  logStep(
    'Batch Publish Update',
    `Processing files from ${directoryPath} on ${config.walrus.network}`
  );

  // Step 1: Gather all files from directory
  logStep('Batch Publish Update', 'Gathering files...');
  const files = await gatherFiles(directoryPath);

  if (!files.length) {
    throw new Error('No files found in the specified directory');
  }

  logStep('Batch Publish Update', `Found ${files.length} file(s) to process`);

  // Step 2: Upload files to Walrus one by one
  const signer = await loadPublisherKeypair(config.walrus.secret);
  logStep('Batch Publish Update', `Using signer: ${signer.toSuiAddress()}`);

  const client = createWalrusClient(config.walrus.network);
  const uploadResults: FileUploadResult[] = [];

  for (const filePath of files) {
    const relativePath = formatPath(relative(directoryPath, filePath));
    logStep('Batch Publish Update', `Uploading ${relativePath}...`);

    const mime = lookupMime(filePath) || 'application/octet-stream';
    const contents = await Bun.file(filePath).bytes();

    const walrusFile = WalrusFile.from({
      contents,
      identifier: '/',
      tags: {
        'content-type': mime,
      },
    });

    const patches = await client.walrus.writeFiles({
      files: [walrusFile],
      epochs: config.walrus.epochs,
      deletable: config.walrus.deletable,
      signer,
    });

    if (!patches.length || !patches[0]?.blobId) {
      throw new Error(`Failed to upload ${relativePath} to Walrus`);
    }

    const blobId = patches[0].blobId;
    uploadResults.push({
      path: relativePath,
      walrusId: blobId,
    });

    logStep('Batch Publish Update', `Uploaded ${relativePath} -> ${blobId}`);
  }

  logStep(
    'Batch Publish Update',
    `Successfully uploaded ${uploadResults.length} file(s) to Walrus`
  );

  // Step 3: Fetch existing pages
  const suiClient = createSuiClient(config.walrus.network);
  logStep('Batch Publish Update', 'Fetching existing pages...');
  const existingPages = await getPages({
    client: suiClient,
    press3ObjectId,
  });

  // Step 4: Build and execute PTB
  logStep(
    'Batch Publish Update',
    'Creating Programmable Transaction Block for batch update/register...'
  );

  const result = await batchUpdateOrRegisterPages({
    client: suiClient,
    signer,
    packageId,
    press3ObjectId,
    pages: uploadResults,
    existingPages,
  });

  logStep('Batch Publish Update', 'Batch operation completed successfully');
  console.log(
    `Transaction: ${getSuiscanUrl(config.walrus.network, result.digest)}`
  );
  console.log(
    `\nProcessed ${uploadResults.length} page(s) in a single transaction`
  );
}

async function gatherFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await gatherFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatPath(value: string): string {
  const normalized = value.split('\\').join('/');
  if (!normalized || normalized === '.') return '/';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}
