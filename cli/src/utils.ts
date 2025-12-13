import { existsSync } from 'node:fs';

export async function ensurePathExists(path: string, label: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
}

export async function fileExists(path: string): Promise<boolean> {
  return Bun.file(path).exists();
}

export function hexToBytes(value: string) {
  if (value.length % 2 !== 0) {
    throw new Error('Hex-encoded secrets must have an even length.');
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < value.length; i += 2) {
    bytes[i / 2] = Number.parseInt(value.slice(i, i + 2), 16);
  }
  return bytes;
}
