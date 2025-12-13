import { WalrusFile } from '@mysten/walrus';
import { lookup as lookupMime } from 'mime-types';
import { DEFAULT_CONFIG } from './config';
import { logStep } from './logger';
import { createWalrusClient, loadPublisherKeypair } from './walrus';

export async function handlePublish(flags: Record<string, string | boolean>) {
  const filePath = flags.file as string;

  if (!filePath) {
    throw new Error('Missing required option: --file');
  }

  const config = DEFAULT_CONFIG;
  logStep(
    'Publish',
    `Publishing ${filePath} to Walrus ${config.walrus.network}`
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

  const signer = await loadPublisherKeypair(config.walrus.secret);
  logStep('Publish', `Using signer: ${signer.toSuiAddress()}`);

  const client = createWalrusClient(config.walrus.network);

  const patches = await client.walrus.writeFiles({
    files: [walrusFile],
    epochs: config.walrus.epochs,
    deletable: config.walrus.deletable,
    signer,
  });

  if (!patches.length) {
    throw new Error('Walrus writeFiles returned zero patches.');
  }

  const blobId = patches[0]?.blobId;
  logStep('Publish', `File published to Walrus`);
  console.log(`Blob ID: ${blobId}`);
}
