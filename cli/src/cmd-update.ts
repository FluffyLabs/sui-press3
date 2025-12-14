import { WalrusFile } from '@mysten/walrus';
import { lookup as lookupMime } from 'mime-types';
import { DEFAULT_CONFIG, PRESS3_CONF_NAME, type Press3Config } from './config';
import { logStep } from './logger';
import {
  createSuiClient,
  getPages,
  getSuiscanUrl,
  registerPage,
  updatePage,
} from './sui';
import { ensurePathExists } from './utils';
import { createWalrusClient, loadPublisherKeypair } from './walrus';

export async function handleUpdate(flags: Record<string, string | boolean>) {
  await ensurePathExists(PRESS3_CONF_NAME, 'Press3 config file');
  const { package_id: packageId, press3_object_id: press3ObjectId } =
    Bun.YAML.parse(await Bun.file(PRESS3_CONF_NAME).text()) as Press3Config;
  const pagePath = flags.path as string;
  let walrusId = flags['blob-id'] as string;
  const filePath = flags.file as string;

  if (!pagePath) {
    throw new Error('Missing required option: --path');
  }

  // Check that either --blob-id or --file is provided (but not both)
  if (!walrusId && !filePath) {
    throw new Error('Either --blob-id or --file must be provided');
  }

  if (walrusId && filePath) {
    throw new Error('Cannot specify both --blob-id and --file');
  }

  const config = DEFAULT_CONFIG;

  // Load signer once (will be used for both Walrus upload and SUI transaction)
  const signer = await loadPublisherKeypair(config.walrus.secret);
  logStep('Update', `Using signer: ${signer.toSuiAddress()}`);

  // If --file is provided, upload to Walrus first
  if (filePath) {
    logStep(
      'Update',
      `Uploading ${filePath} to Walrus ${config.walrus.network}`
    );

    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }

    const mime = lookupMime(filePath) || 'application/octet-stream';
    const contents = await file.bytes();

    const walrusFile = WalrusFile.from({
      contents,
      identifier: '/',
      tags: {
        'content-type': mime,
      },
    });

    const walrusClient = createWalrusClient(config.walrus.network);

    const patches = await walrusClient.walrus.writeFiles({
      files: [walrusFile],
      epochs: config.walrus.epochs,
      deletable: config.walrus.deletable,
      signer,
    });

    if (!patches.length) {
      throw new Error('Walrus writeFiles returned zero patches.');
    }

    walrusId = patches[0]?.blobId as string;
    logStep('Update', `File published to Walrus`);
    console.log(`Blob ID: ${walrusId}`);
  }

  logStep('Update', `Updating page ${pagePath} on ${config.walrus.network}`);

  const client = createSuiClient(config.walrus.network);

  // Fetch all pages from the Press3 object
  logStep('Update', 'Fetching pages from Press3 object...');
  const pages = await getPages({ client, press3ObjectId });

  // Find the page by path
  const pageIndex = pages.findIndex((page) => page.path === pagePath);

  if (pageIndex === -1) {
    logStep('Update', `Registering ${pagePath}...`);
    const registerResult = await registerPage({
      client,
      signer,
      packageId,
      press3ObjectId,
      pagePath,
      walrusId,
    });

    logStep('Update', 'Page registered successfully!');
    console.log(
      `Transaction: ${getSuiscanUrl(config.walrus.network, registerResult.digest)}`
    );
  } else {
    logStep(
      'Update',
      `Found page at index ${pageIndex}. Current Walrus ID: ${pages[pageIndex]?.walrus_id}`
    );

    // Update the page
    logStep('Update', `Updating page to new Walrus ID: ${walrusId}`);
    const result = await updatePage({
      client,
      signer,
      packageId,
      press3ObjectId,
      pageIndex,
      pagePath,
      walrusId,
    });

    logStep('Update', 'Page updated successfully');
    console.log(
      `Transaction: ${getSuiscanUrl(config.walrus.network, result.digest)}`
    );
  }
}
