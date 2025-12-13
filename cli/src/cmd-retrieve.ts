import { DEFAULT_CONFIG } from './config';
import { logStep } from './logger';
import { createWalrusClient } from './walrus';

export async function handleRetrieve(flags: Record<string, string | boolean>) {
  const blobId = flags['blob-id'] as string;
  const outputPath = flags.output as string | undefined;

  if (!blobId) {
    throw new Error('Missing required option: --blob-id');
  }

  const config = DEFAULT_CONFIG;
  logStep(
    'Retrieve',
    `Retrieving blob ${blobId} from Walrus ${config.walrus.network}`
  );

  const client = createWalrusClient(config.walrus.network);

  // Read the blob from Walrus
  const blobData = await client.walrus.readBlob({ blobId });

  if (outputPath) {
    // Save to file
    await Bun.write(outputPath, blobData);
    logStep('Retrieve', `Blob saved to ${outputPath}`);
    console.log(`Retrieved ${blobData.length} bytes`);
  } else {
    // Write to stdout
    process.stdout.write(blobData);
  }
}
