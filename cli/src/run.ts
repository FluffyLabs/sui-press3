import { handleContract } from './cmd-contract';
import { handleDeploy } from './cmd-deploy';
import { handleInit } from './cmd-init';
import { handlePromote } from './cmd-promote';
import { handlePublish } from './cmd-publish';
import { handleRetrieve } from './cmd-retrieve';
import { handleUpdate } from './cmd-update';
import { logStep } from './logger';

type Command =
  | 'deploy'
  | 'publish'
  | 'retrieve'
  | 'contract'
  | 'assign-domain'
  | 'renew'
  | 'index'
  | 'init'
  | 'update'
  | 'promote'
  | 'help';

type ParsedArgs = {
  command: Command;
  flags: Record<string, string | boolean>;
};

const HELP_TEXT = `
Press3 CLI

Usage:
  press3 <command> [options]

Commands:
  deploy         Upload a Walrus site bundle and update the Move contract
  publish        Upload a single file to Walrus and get the blob ID
  retrieve       Download a blob from Walrus by blob ID
  contract       Build and publish the Move contract to SUI
  init           Build and publish Press3 contract, upload frontend to walrus and initialize home page
  update         Update an existing page or register new one with a new Walrus blob ID
  promote        Add or remove editors for a specific page
  assign-domain  Attach a DNS/NS record to a Walrus site
  renew          Proactively renew Walrus blobs for a deployment
  index          Build the off-chain search index and publish it

Global options:
  --dry-run          Print actions without executing transactions

Deploy options:
  --use-cli          Use site-builder for deployment instead of SDK

Publish options:
  --file             Path to the file to publish (required)

Retrieve options:
  --blob-id          Blob ID to retrieve (required)
  --output           Path to save the retrieved blob (optional, prints to stdout if not specified)

Contract options:
  --use-cli          Use sui CLI instead of SDK with WALRUS_PUBLISH_SECRET

Init options:
  --home             Walrus Blob ID to set as homepage (required)
  --demo             Setup initial homepage, index.html and article.md (ignores flag --home)
  --output           Path to save the configuration file (default: press3.init.log)

Update options:
  --path             Page path to update (required)
  --blob-id          New Walrus blob ID (required)

Promote options:
  --path             Page path to manage editors for (required)
  --add              Comma-separated list of Sui addresses to add as editors
  --remove           Comma-separated list of Sui addresses to remove from editors
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
    command: [
      'deploy',
      'publish',
      'retrieve',
      'contract',
      'assign-domain',
      'renew',
      'index',
      'init',
      'update',
      'promote',
    ].includes(command)
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
    case 'retrieve':
      await handleRetrieve(flags);
      break;
    case 'contract':
      await handleContract(flags);
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
    case 'init':
      await handleInit(flags);
      break;
    case 'update':
      await handleUpdate(flags);
      break;
    case 'promote':
      await handlePromote(flags);
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
