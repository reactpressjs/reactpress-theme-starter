#!/usr/bin/env node
import * as fs from 'fs/promises';
import * as path from 'path';

import {
  ReactPressClient,
  createLocalArticleFile,
  previewUrl,
  publishFile,
  pullArticleToFile,
  pushFile,
  SyncConflictError,
} from '@fecommunity/reactpress-content';

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]): { command: string; positionals: string[]; flags: Flags } {
  const cleaned = argv[0] === '--' ? argv.slice(1) : argv;
  const [command = 'help', ...rest] = cleaned;
  const positionals: string[] = [];
  const flags: Flags = {};

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i += 1;
      }
    } else {
      positionals.push(arg);
    }
  }

  return { command, positionals, flags };
}

function flagString(flags: Flags, key: string, fallback?: string): string | undefined {
  const value = flags[key];
  if (typeof value === 'string') return value;
  return fallback;
}

async function readTokenFile(tokenPath?: string): Promise<string | undefined> {
  if (!tokenPath) return undefined;
  return (await fs.readFile(tokenPath, 'utf8')).trim();
}

async function createClient(flags: Flags): Promise<ReactPressClient> {
  const apiUrl =
    flagString(flags, 'api') ||
    process.env.REACTPRESS_API_URL ||
    'http://localhost:3002/api';
  const token =
    flagString(flags, 'token') ||
    process.env.REACTPRESS_TOKEN ||
    (await readTokenFile(flagString(flags, 'token-file')));

  const client = new ReactPressClient({ apiUrl, token });

  const user = flagString(flags, 'user') || process.env.REACTPRESS_USER;
  const password = flagString(flags, 'password') || process.env.REACTPRESS_PASSWORD;
  if (!token && user && password) {
    const result = await client.login({ name: user, password });
    console.log(`Logged in as ${user}`);
    if (flags['save-token']) {
      const out = typeof flags['save-token'] === 'string' ? flags['save-token'] : '.reactpress-token';
      await fs.writeFile(out, result.token, 'utf8');
      console.log(`Token saved to ${out}`);
    }
  }

  if (!client.http.token) {
    throw new Error('Missing token. Pass --token, --token-file, or --user/--password');
  }

  return client;
}

async function uploadFactory(client: ReactPressClient) {
  return async (absolutePath: string): Promise<string> => {
    const buffer = await fs.readFile(absolutePath);
    const blob = new Blob([buffer]);
    const uploaded = await client.uploadFile(blob, path.basename(absolutePath));
    return uploaded.url;
  };
}

function printHelp(): void {
  console.log(`ReactPress content CLI

Usage:
  reactpress-content login --api <url> --user <name> --password <pass> [--save-token]
  reactpress-content new <title> [--dir content/posts]
  reactpress-content push <file.md> [--force] [--api ...] [--token ...]
  reactpress-content publish <file.md> [--force]
  reactpress-content pull <articleId> [--out content/posts/<id>.md]
  reactpress-content preview <articleId> [--site <siteUrl>]

Env:
  REACTPRESS_API_URL   default http://localhost:3002/api
  REACTPRESS_TOKEN
  REACTPRESS_USER / REACTPRESS_PASSWORD
`);
}

async function main(): Promise<void> {
  const { command, positionals, flags } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        return;

      case 'login': {
        const client = await createClient(flags);
        console.log('OK — authenticated against', client.http.apiUrl);
        return;
      }

      case 'new': {
        const title = positionals[0] || 'Untitled';
        const dir = flagString(flags, 'dir') || path.join(process.cwd(), 'content', 'posts');
        const created = await createLocalArticleFile(dir, title);
        console.log(created.filePath);
        return;
      }

      case 'push': {
        const file = positionals[0];
        if (!file) throw new Error('Usage: reactpress-content push <file.md>');
        const client = await createClient(flags);
        const result = await pushFile(client, path.resolve(file), {
          force: Boolean(flags.force),
          uploadLocalFile: await uploadFactory(client),
        });
        console.log(`${result.created ? 'Created' : 'Updated'} ${result.article.id} (${result.document.frontmatter.status})`);
        return;
      }

      case 'publish': {
        const file = positionals[0];
        if (!file) throw new Error('Usage: reactpress-content publish <file.md>');
        const client = await createClient(flags);
        const result = await publishFile(client, path.resolve(file), {
          force: Boolean(flags.force),
          uploadLocalFile: await uploadFactory(client),
        });
        console.log(`Published ${result.article.id}`);
        return;
      }

      case 'pull': {
        const id = positionals[0];
        if (!id) throw new Error('Usage: reactpress-content pull <articleId>');
        const client = await createClient(flags);
        const out =
          flagString(flags, 'out') ||
          path.join(process.cwd(), 'content', 'posts', `${id}.md`);
        const result = await pullArticleToFile(client, id, path.resolve(out));
        console.log(result.filePath);
        return;
      }

      case 'preview': {
        const id = positionals[0];
        if (!id) throw new Error('Usage: reactpress-content preview <articleId>');
        const site =
          flagString(flags, 'site') ||
          process.env.CLIENT_SITE_URL ||
          process.env.REACTPRESS_SITE_URL ||
          'http://localhost:3001';
        console.log(previewUrl(site, id));
        return;
      }

      default:
        printHelp();
        process.exitCode = 1;
    }
  } catch (error) {
    if (error instanceof SyncConflictError) {
      console.error(`Conflict: ${error.message}`);
      process.exitCode = 2;
      return;
    }
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
