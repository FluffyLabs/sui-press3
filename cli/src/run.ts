import { handleContract } from './cmd-contract';
import { handleDeploy } from './cmd-deploy';
import { handlePublish } from './cmd-publish';
import { handleRetrieve } from './cmd-retrieve';
import { logStep } from './logger';

type Command =
  | 'deploy'
  | 'publish'
  | 'retrieve'
  | 'contract'
  | 'assign-domain'
  | 'renew'
  | 'index'
  | 'help';

type ParsedArgs = {
  command: Command;
  flags: Record<string, string | boolean>;
};

const HELP_TEXT = `
Press3 CLI (Bun)

Usage:
  press3 <command> [options]

Commands:
  deploy         Upload a Walrus site bundle and update the Move contract
  publish        Upload a single file to Walrus and get the blob ID
  retrieve       Download a blob from Walrus by blob ID
  contract       Build and publish the Move contract to SUI
  assign-domain  Attach a DNS/NS record to a Walrus site
  renew          Proactively renew Walrus blobs for a deployment
  index          Build the off-chain search index and publish it

Global options:
  --dry-run          Print actions without executing transactions

Deploy options:
  --use-sdk          Use the SDK for deployment instead of site-builder

Publish options:
  --file             Path to the file to publish (required)

Retrieve options:
  --blob-id          Blob ID to retrieve (required)
  --output           Path to save the retrieved blob (optional, prints to stdout if not specified)

Contract options:
  --use-sdk          Use WALRUS_PUBLISH_SECRET from .env instead of sui CLI
`;

function parseArgs(argv: string[]): ParsedArgs {
  const [, , maybeCommand, ...rest] = argv;
  const command = (maybeCommand ?? 'help') as Command;
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token?.startsWith('--')) continue;

    const key = token.slice(2);
    const next = rest[i + 1];

    if (!next || next.startsWith('--')) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    i += 1;
  }

  return {
<<<<<<< HEAD
    command: ['deploy', 'publish', 'retrieve', 'assign-domain', 'renew', 'index'].includes(
      command
    )
=======
    command: [
      'deploy',
      'publish',
      'contract',
      'assign-domain',
      'renew',
      'index',
    ].includes(command)
>>>>>>> main
      ? (command as Command)
      : 'help',
    flags,
  };
}

export async function run() {
  const { command, flags } = parseArgs(Bun.argv);
  switch (command) {
    case 'deploy':
      await handleDeploy(flags);
      break;
    case 'publish':
      await handlePublish(flags);
      break;
<<<<<<< HEAD
    case 'retrieve':
      await handleRetrieve(flags);
=======
    case 'contract':
      await handleContract(flags);
>>>>>>> main
      break;
    case 'assign-domain':
      await handleAssignDomain(flags);
      break;
    case 'renew':
      await handleRenew(flags);
      break;
    case 'index':
      await handleIndex(flags);
      break;
    default:
      console.log(HELP_TEXT.trim());
  }
}

async function handleAssignDomain(flags: Record<string, string | boolean>) {
  const target = (flags.target as string) ?? 'walrus://blob/site';
  const domain = (flags.domain as string) ?? 'example.press3.sui';
  logStep('Assign domain', `${domain} -> ${target}`);
  // TODO: integrate with Walrus NS helpers
}

async function handleRenew(flags: Record<string, string | boolean>) {
  const batchSize = Number(flags['batch-size'] ?? 25);
  logStep('Auto-renew', `Scanning registry in batches of ${batchSize}`);
  // TODO: fetch registry, renew expiring blobs, batch txns
}

async function handleIndex(flags: Record<string, string | boolean>) {
  const output = (flags.output as string) ?? 'dist/search-index.json';
  logStep('Indexer', `Writing Walrus-ready index to ${output}`);
  // TODO: pull Walrus blobs, build compressed index, upload
}
