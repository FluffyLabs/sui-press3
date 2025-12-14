import { normalizeSuiAddress } from '@mysten/sui/utils';
import { DEFAULT_CONFIG, PRESS3_CONF_NAME, type Press3Config } from './config';
import { logStep } from './logger';
import { createSuiClient, getPages, getSuiscanUrl, setEditors } from './sui';
import { ensurePathExists } from './utils';
import { loadPublisherKeypair } from './walrus';

export async function handlePromote(flags: Record<string, string | boolean>) {
  await ensurePathExists(PRESS3_CONF_NAME, 'Press3 config file');
  const { package_id: packageId, press3_object_id: press3ObjectId } =
    Bun.YAML.parse(await Bun.file(PRESS3_CONF_NAME).text()) as Press3Config;
  const pagePath = flags.path as string;
  const addAddresses = flags.add as string | undefined;
  const removeAddresses = flags.remove as string | undefined;

  if (!pagePath) {
    throw new Error('Missing required option: --path');
  }

  if (!addAddresses && !removeAddresses) {
    throw new Error('At least one of --add or --remove flags is required');
  }

  const config = DEFAULT_CONFIG;
  logStep('Promote', `Managing editors for page ${pagePath}`);

  const client = createSuiClient(config.walrus.network);
  const signer = await loadPublisherKeypair(config.walrus.secret);

  logStep('Promote', `Using signer: ${signer.toSuiAddress()}`);

  // Fetch all pages from the Press3 object
  logStep('Promote', 'Fetching pages from Press3 object...');
  const pages = await getPages({ client, press3ObjectId });

  // Find the page by path
  const pageIndex = pages.findIndex((page) => page.path === pagePath);

  if (pageIndex === -1) {
    throw new Error(`Page not found: ${pagePath}`);
  }

  const currentPage = pages[pageIndex];
  if (!currentPage) {
    throw new Error(`Page data not found at index ${pageIndex}`);
  }

  logStep(
    'Promote',
    `Found page at index ${pageIndex}. Current editors: ${currentPage.editors.length > 0 ? currentPage.editors.join(', ') : 'none'}`
  );

  // Parse and validate addresses to add
  const addressesToAdd: string[] = [];
  if (addAddresses) {
    const addList = addAddresses.split(',').map((addr) => addr.trim());
    for (const addr of addList) {
      try {
        const normalized = normalizeSuiAddress(addr);
        addressesToAdd.push(normalized);
      } catch (_error) {
        throw new Error(`Invalid Sui address in --add: ${addr}`);
      }
    }
  }

  // Parse and validate addresses to remove
  const addressesToRemove: string[] = [];
  if (removeAddresses) {
    const removeList = removeAddresses.split(',').map((addr) => addr.trim());
    for (const addr of removeList) {
      try {
        const normalized = normalizeSuiAddress(addr);
        addressesToRemove.push(normalized);
      } catch (_error) {
        throw new Error(`Invalid Sui address in --remove: ${addr}`);
      }
    }
  }

  // Create new editor list
  let newEditors = [...currentPage.editors];

  // Add addresses (without duplicates)
  if (addressesToAdd.length > 0) {
    for (const addr of addressesToAdd) {
      if (!newEditors.includes(addr)) {
        newEditors.push(addr);
      }
    }
    logStep(
      'Promote',
      `Adding ${addressesToAdd.length} address(es): ${addressesToAdd.join(', ')}`
    );
  }

  // Remove addresses
  if (addressesToRemove.length > 0) {
    newEditors = newEditors.filter((addr) => !addressesToRemove.includes(addr));
    logStep(
      'Promote',
      `Removing ${addressesToRemove.length} address(es): ${addressesToRemove.join(', ')}`
    );
  }

  logStep(
    'Promote',
    `New editor list (${newEditors.length}): ${newEditors.length > 0 ? newEditors.join(', ') : 'none'}`
  );

  // Update editors
  const result = await setEditors({
    client,
    signer,
    packageId,
    press3ObjectId,
    pageIndex,
    pagePath,
    editors: newEditors,
  });

  logStep('Promote', 'Editors updated successfully');
  console.log(
    `Transaction: ${getSuiscanUrl(config.walrus.network, result.digest)}`
  );
}
