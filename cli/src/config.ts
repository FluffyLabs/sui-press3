export type WalrusNetwork = 'testnet' | 'mainnet';

export const SUPPORTED_NETWORKS: WalrusNetwork[] = ['testnet', 'mainnet'];

function getWalrusNetwork(): WalrusNetwork {
  const network = process.env.WALRUS_NETWORK || 'testnet';
  if (!SUPPORTED_NETWORKS.includes(network as WalrusNetwork)) {
    throw new Error(
      `Invalid WALRUS_NETWORK: ${network}. Must be one of: ${SUPPORTED_NETWORKS.join(', ')}`
    );
  }
  return network as WalrusNetwork;
}

function getWalrusEpochs(): number {
  const epochs = process.env.WALRUS_EPOCHS;
  if (epochs) {
    const parsed = Number.parseInt(epochs, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      throw new Error(
        `Invalid WALRUS_EPOCHS: ${epochs}. Must be a positive integer.`
      );
    }
    return parsed;
  }
  return 1;
}

export const DEFAULT_CONFIG = {
  frontendDir: '../frontend',
  quiltEntry: 'dist/index.html',
  quiltAssetsDir: 'dist',
  walrus: {
    secret: process.env.WALRUS_PUBLISH_SECRET || '',
    epochs: getWalrusEpochs(),
    network: getWalrusNetwork(),
    deletable: true,
  },
};
