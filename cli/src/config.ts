export type WalrusNetwork = 'testnet' | 'mainnet';
export type SuiNetwork = 'testnet' | 'mainnet';

export const PRESS3_CONF_NAME = 'press3.config.yml';
export const SUPPORTED_NETWORKS: WalrusNetwork[] = ['testnet', 'mainnet'];

export interface Press3Config {
  package_id: string;
  press3_object_id: string;
  network: string;
}

function getSuiWalrusNetwork(): WalrusNetwork {
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
  contractDir: '../contract',
  quiltEntry: 'dist/index.html',
  quiltAssetsDir: 'dist',
  walrus: {
    // TODO: rename to client
    secret: process.env.WALRUS_PUBLISH_SECRET || '',
    epochs: getWalrusEpochs(),
    network: getSuiWalrusNetwork(),
    deletable: true,
  },
};

export async function fileExists(path: string): Promise<boolean> {
  return Bun.file(path).exists();
}
