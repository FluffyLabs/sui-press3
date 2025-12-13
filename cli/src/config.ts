export type WalrusNetwork = 'testnet' | 'mainnet';
export type SuiNetwork = 'testnet' | 'mainnet';

export const SUPPORTED_NETWORKS: WalrusNetwork[] = ['testnet', 'mainnet'];
export const SUPPORTED_SUI_NETWORKS: SuiNetwork[] = ['testnet', 'mainnet'];

function getWalrusNetwork(): WalrusNetwork {
  const network = process.env.WALRUS_NETWORK || 'testnet';
  if (!SUPPORTED_NETWORKS.includes(network as WalrusNetwork)) {
    throw new Error(
      `Invalid WALRUS_NETWORK: ${network}. Must be one of: ${SUPPORTED_NETWORKS.join(', ')}`
    );
  }
  return network as WalrusNetwork;
}

function getSuiNetwork(): SuiNetwork {
  const network = process.env.SUI_NETWORK || 'testnet';
  if (!SUPPORTED_SUI_NETWORKS.includes(network as SuiNetwork)) {
    throw new Error(
      `Invalid SUI_NETWORK: ${network}. Must be one of: ${SUPPORTED_SUI_NETWORKS.join(', ')}`
    );
  }
  return network as SuiNetwork;
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
  sui: {
    network: getSuiNetwork(),
  },
  walrus: {
    secret: process.env.WALRUS_PUBLISH_SECRET || '',
    epochs: getWalrusEpochs(),
    network: getWalrusNetwork(),
    deletable: true,
  },
};
