import { promises as fs } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { getFullnodeUrl } from '@mysten/sui/client';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { WalrusFile, walrus } from '@mysten/walrus';
import { lookup as lookupMime } from 'mime-types';
import type { WalrusNetwork } from '../config';
import { ensurePathExists, hexToBytes } from '../utils';

export async function prepareWalrusFiles(options: {
  assetsDir: string;
  entryPath: string;
}): Promise<WalrusFile[]> {
  await ensurePathExists(options.assetsDir, 'build assets');
  const files = await gatherFiles(options.assetsDir);
  if (!files.length) {
    throw new Error('No build artifacts found, aborting Walrus deployment.');
  }
  if (!files.includes(options.entryPath)) {
    throw new Error(
      `Entry file ${options.entryPath} missing from build output.`
    );
  }

  files.sort((a, b) => {
    if (a === options.entryPath) return -1;
    if (b === options.entryPath) return 1;
    return a.localeCompare(b);
  });

  return Promise.all(
    files.map((filePath) => createWalrusFile(filePath, options.assetsDir))
  );
}

async function gatherFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await gatherFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function createWalrusFile(filePath: string, baseDir: string) {
  const identifier = formatIdentifier(relative(baseDir, filePath));
  const mime = lookupMime(filePath) || 'application/octet-stream';
  const contents = new Uint8Array(await Bun.file(filePath).arrayBuffer());

  return WalrusFile.from({
    contents,
    identifier,
    tags: {
      'content-type': mime,
    },
  });
}

function formatIdentifier(value: string) {
  const normalized = value.split(sep).join('/');
  if (!normalized || normalized === '.') return '/';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export async function loadPublisherKeypair(secret: string) {
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error('Publisher key is empty.');
  }

  if (trimmed.startsWith('suiprivkey')) {
    const decoded = decodeSuiPrivateKey(trimmed);
    if (decoded.scheme !== 'ED25519') {
      throw new Error(`Unsupported key scheme: ${decoded.scheme}`);
    }
    return Ed25519Keypair.fromSecretKey(decoded.secretKey);
  }

  const withoutPrefix = trimmed.startsWith('ed25519:')
    ? trimmed.slice('ed25519:'.length)
    : trimmed;

  if (withoutPrefix.startsWith('0x')) {
    return Ed25519Keypair.fromSecretKey(hexToBytes(withoutPrefix.slice(2)));
  }

  try {
    return Ed25519Keypair.fromSecretKey(fromBase64(withoutPrefix));
  } catch (error) {
    throw new Error(`Unable to parse publisher key: ${error}`);
  }
}

export function createWalrusClient(network: WalrusNetwork) {
  const rpcUrl = getFullnodeUrl(network);
  return new SuiJsonRpcClient({
    url: rpcUrl,
    network,
  }).$extend(walrus());
}
