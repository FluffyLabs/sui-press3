import {
  DEFAULT_CONFIG,
  fileExists,
  PRESS3_CONF_NAME,
  type Press3Config,
} from './config';
import { logStep } from './logger';
import {
  createSuiClient,
  getPages,
  getSuiscanUrl,
  registerPage,
  updatePage,
} from './sui';
import { loadPublisherKeypair } from './walrus';

export async function handleUpdate(flags: Record<string, string | boolean>) {
  if (!(await fileExists(PRESS3_CONF_NAME))) {
    throw new Error('Missing press3.config.yml');
  }
  const { package_id: packageId, press3_object_id: press3ObjectId } =
    Bun.YAML.parse(await Bun.file(PRESS3_CONF_NAME).text()) as Press3Config;
  const pagePath = flags.path as string;
  const walrusId = flags['blob-id'] as string;

  if (!pagePath) {
    throw new Error('Missing required option: --path');
  }

  if (!walrusId) {
    throw new Error('Missing required option: --blob-id');
  }

  const config = DEFAULT_CONFIG;
  logStep('Update', `Updating page ${pagePath} on ${config.walrus.network}`);

  const client = createSuiClient(config.walrus.network);
  const signer = await loadPublisherKeypair(config.walrus.secret);

  logStep('Update', `Using signer: ${signer.toSuiAddress()}`);

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
