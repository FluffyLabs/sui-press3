import { DEFAULT_CONFIG, PRESS3_CONF_NAME, type Press3Config } from './config';
import { logStep } from './logger';
import { createSuiClient, getPages } from './sui';
import { ensurePathExists } from './utils';
import { createWalrusClient } from './walrus';

/**
 * LIMITATION: This health check can only report storage epoch information for blobs
 * that have associated on-chain Blob objects on SUI. Blobs uploaded via certain methods
 * (e.g., site-builder without on-chain registration) may not have these objects, and will
 * be reported as "unknown" status.
 *
 * To support full health checking, the Press3 contract would need to store both:
 * - The Walrus blob ID (for content retrieval)
 * - The SUI Blob object ID (for querying storage metadata)
 *
 * Currently, only the Walrus blob ID is stored in the contract.
 */

interface BlobHealth {
  path: string;
  walrusId: string;
  currentEpoch: number;
  endEpoch: number | null;
  epochsRemaining: number | null;
  status: 'healthy' | 'expiring' | 'expired' | 'unknown';
}

export async function handleHealth(flags: Record<string, string | boolean>) {
  const config = DEFAULT_CONFIG;

  // Load Press3 object ID from config file (matches pattern in update, promote, batch-publish-update)
  await ensurePathExists(PRESS3_CONF_NAME, 'Press3 config file');
  const { press3_object_id: press3ObjectId } = Bun.YAML.parse(
    await Bun.file(PRESS3_CONF_NAME).text()
  ) as Press3Config;

  const shouldRenew = flags.renew === true;
  const expiringThreshold = Number(flags['expiring-threshold'] ?? 2);

  logStep(
    'Health Check',
    `Checking blob health for Press3 contract: ${press3ObjectId}`
  );

  // Create clients
  const suiClient = createSuiClient(config.walrus.network);
  const walrusClient = createWalrusClient(config.walrus.network);

  // Get all pages from the contract
  const pages = await getPages({
    client: suiClient,
    press3ObjectId,
  });

  if (pages.length === 0) {
    console.log('No pages found in the contract.');
    return;
  }

  logStep(
    'Health Check',
    `Found ${pages.length} pages. Querying blob status...`
  );

  // Get current epoch from Walrus system state
  const systemState = await walrusClient.walrus.systemState();
  const currentEpoch = systemState.committee.epoch;

  logStep('Health Check', `Current epoch: ${currentEpoch}`);

  // Check health of each blob
  const healthResults: BlobHealth[] = [];

  for (const page of pages) {
    try {
      // Attempt to get blob storage information
      // Note: This only works if the blob has an on-chain Blob object
      const blob = await walrusClient.walrus.getBlob({
        blobId: page.walrus_id,
      });

      const endEpoch = await blob.storedUntil();

      let epochsRemaining: number | null = null;
      let status: BlobHealth['status'] = 'unknown';

      if (endEpoch !== null) {
        epochsRemaining = endEpoch - currentEpoch;

        if (epochsRemaining < 0) {
          status = 'expired';
        } else if (epochsRemaining <= expiringThreshold) {
          status = 'expiring';
        } else {
          status = 'healthy';
        }
      }

      healthResults.push({
        path: page.path,
        walrusId: page.walrus_id,
        currentEpoch,
        endEpoch,
        epochsRemaining,
        status,
      });
    } catch (_error) {
      // Blob exists in storage but has no on-chain Blob object with storage metadata
      // This can happen when blobs are uploaded without on-chain registration
      healthResults.push({
        path: page.path,
        walrusId: page.walrus_id,
        currentEpoch,
        endEpoch: null,
        epochsRemaining: null,
        status: 'unknown',
      });
    }
  }

  // Display results
  displayHealthResults(healthResults, expiringThreshold);

  // Handle --renew flag
  if (shouldRenew) {
    const expiringBlobs = healthResults.filter(
      (b) => b.status === 'expiring' || b.status === 'expired'
    );

    if (expiringBlobs.length === 0) {
      console.log('\nNo blobs need renewal.');
    } else {
      console.log(
        `\n⚠️  --renew flag detected, but renewal is not yet implemented.`
      );
      console.log(
        `Found ${expiringBlobs.length} blob(s) that would need renewal.`
      );
    }
  }
}

function displayHealthResults(
  results: BlobHealth[],
  expiringThreshold: number
) {
  console.log('\n=== Blob Health Report ===\n');

  // Group by status
  const healthy = results.filter((r) => r.status === 'healthy');
  const expiring = results.filter((r) => r.status === 'expiring');
  const expired = results.filter((r) => r.status === 'expired');
  const unknown = results.filter((r) => r.status === 'unknown');

  // Summary
  console.log('Summary:');
  console.log(`  ✓ Healthy: ${healthy.length}`);
  console.log(
    `  ⚠ Expiring (≤${expiringThreshold} epochs): ${expiring.length}`
  );
  console.log(`  ✗ Expired: ${expired.length}`);
  console.log(`  ? Unknown: ${unknown.length}`);
  console.log();

  // Show expired blobs first (most urgent)
  if (expired.length > 0) {
    console.log('🔴 EXPIRED BLOBS:');
    for (const blob of expired) {
      const epochsAgo =
        blob.epochsRemaining !== null
          ? Math.abs(blob.epochsRemaining)
          : 'unknown';
      console.log(
        `  ✗ ${blob.path} (${blob.walrusId.slice(0, 12)}...): ${blob.epochsRemaining} epochs (expired ${epochsAgo} epochs ago)`
      );
    }
    console.log();
  }

  // Show expiring blobs
  if (expiring.length > 0) {
    console.log('⚠️  EXPIRING SOON:');
    for (const blob of expiring) {
      console.log(
        `  ⚠ ${blob.path} (${blob.walrusId.slice(0, 12)}...): ${blob.epochsRemaining} epochs remaining`
      );
    }
    console.log();
  }

  // Show healthy blobs
  if (healthy.length > 0) {
    console.log('✓ HEALTHY:');
    for (const blob of healthy) {
      console.log(
        `  ✓ ${blob.path} (${blob.walrusId.slice(0, 12)}...): ${blob.epochsRemaining} epochs remaining`
      );
    }
    console.log();
  }

  // Show unknown blobs
  if (unknown.length > 0) {
    console.log('? UNKNOWN STATUS:');
    for (const blob of unknown) {
      console.log(
        `  ? ${blob.path} (${blob.walrusId.slice(0, 12)}...): No on-chain Blob object found`
      );
    }
    console.log();
    console.log(
      '⚠️  Note: Blobs without on-chain Blob objects cannot have their storage'
    );
    console.log(
      '   duration checked. This typically happens when blobs are uploaded without'
    );
    console.log(
      '   on-chain registration (e.g., via site-builder). These blobs may still be'
    );
    console.log(
      '   accessible but their expiration status cannot be determined.'
    );
    console.log();
  }
}
