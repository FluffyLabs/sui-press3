import { join } from 'node:path';

import {DEFAULT_CONFIG} from "../config";
import {logStep} from "../logger";
import {ensurePathExists} from '../utils';
import {createWalrusClient, loadPublisherKeypair, prepareWalrusFiles} from './walrus';

export async function handleDeploy(flags: Record<string, string | boolean>) {
  const dryRun = Boolean(flags['dry-run']);
  const config = DEFAULT_CONFIG;
  logStep(
    'Deploy',
    `Building ${config.frontendDir} to deploy on ${config.walrus.network} ${dryRun ? '(dry-run)' : ''}`
  );

  const quiltEntryPoint = join(config.frontendDir, config.quiltEntry);
  const quiltAssetsDir = join(config.frontendDir, config.quiltAssetsDir);

  await buildFrontend(config.frontendDir);
  await ensurePathExists(quiltEntryPoint, 'quilt entry point');

  const files = await prepareWalrusFiles({
    assetsDir: quiltAssetsDir,
    entryPath: quiltEntryPoint,
  });
  logStep(
    'Deploy',
    `Bundled ${files.length} files from ${quiltAssetsDir}`
  );

  if (dryRun) {
    logStep('Deploy', 'Dry run enabled, skipping Walrus publish');
    return;
  }

  const signer = await loadPublisherKeypair(config.walrus.secret);
  logStep('Deploy', `Using signer key: ${signer.toSuiAddress()}`);

  const client = createWalrusClient(config.walrus.network);

  const patches = await client.walrus.writeFiles({
    files,
    epochs: config.walrus.epochs,
    deletable: config.walrus.deletable,
    signer,
  });

  if (!patches.length) {
    throw new Error('Walrus writeFiles returned zero patches.');
  }

  const quiltId = patches[0]?.blobId;
  const entryPatch = patches[0];
  logStep(
    'Deploy',
    `Walrus quilt ${quiltId} published (${patches.length} files, entry patch ${entryPatch?.id})`
  );

  // TODO [ToDr] Note that this only deploys the content to walrus, but DOES NOT
  // do all of the stuff that the site-builder does (i.e. registers the site).
  // Still need to figure out how to do the rest, but currently the example is
  // useful to show how to deploy to walrus.
}

async function buildFrontend(frontendDir: string) {
  await Bun.$`npm ci`.cwd(frontendDir);
  await Bun.$`npm run build`.cwd(frontendDir);
}

