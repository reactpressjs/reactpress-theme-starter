import { createHash } from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';

interface StoredAuth {
  apiUrl: string;
  token: string;
}

function workspaceIdentity(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    return 'no-workspace';
  }
  return folders
    .map((folder) => folder.uri.toString())
    .sort()
    .join('|');
}

/** SecretStorage key scoped to the current workspace folders. */
function getTokenStorageKey(): string {
  const hash = createHash('sha256').update(workspaceIdentity()).digest('hex').slice(0, 16);
  return `reactpress.token.${hash}`;
}

export function getApiUrl(): string {
  return vscode.workspace.getConfiguration('reactpress').get<string>('apiUrl', 'http://localhost:3002/api');
}

export function getSiteUrl(): string {
  return vscode.workspace.getConfiguration('reactpress').get<string>('siteUrl', 'http://localhost:3001');
}

export function getContentPath(): string {
  return vscode.workspace.getConfiguration('reactpress').get<string>('contentPath', 'content/posts');
}

export function getUsername(): string {
  return vscode.workspace.getConfiguration('reactpress').get<string>('username', '');
}

/**
 * Resolve the content directory for the workspace that owns `uri`
 * (or the active editor / first folder as fallback).
 */
export function getContentAbsoluteDir(uri?: vscode.Uri): string | undefined {
  let folder: vscode.WorkspaceFolder | undefined;
  if (uri) {
    folder = vscode.workspace.getWorkspaceFolder(uri);
  } else {
    const active = vscode.window.activeTextEditor?.document.uri;
    if (active) {
      folder = vscode.workspace.getWorkspaceFolder(active);
    }
  }
  folder = folder ?? vscode.workspace.workspaceFolders?.[0];
  if (!folder) return undefined;
  return path.join(folder.uri.fsPath, getContentPath());
}

export async function getStoredToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  const raw = await context.secrets.get(getTokenStorageKey());
  if (!raw) {
    // Migrate legacy global key once, then re-scope to this workspace.
    const legacy = await context.secrets.get('reactpress.token');
    if (!legacy) return undefined;
    await setStoredToken(context, legacy);
    await context.secrets.delete('reactpress.token');
    return legacy;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.token) return undefined;
    // Drop tokens that belong to a different API URL in this workspace.
    if (parsed.apiUrl && parsed.apiUrl.replace(/\/+$/, '') !== getApiUrl().replace(/\/+$/, '')) {
      return undefined;
    }
    return parsed.token;
  } catch {
    // Plain-string token from an older build — bind to the current apiUrl so
    // later reads enforce the same API-scope check as JSON payloads.
    await setStoredToken(context, raw, getApiUrl());
    return raw;
  }
}

export async function setStoredToken(
  context: vscode.ExtensionContext,
  token: string,
  apiUrl: string = getApiUrl()
): Promise<void> {
  const payload: StoredAuth = { apiUrl: apiUrl.replace(/\/+$/, ''), token };
  await context.secrets.store(getTokenStorageKey(), JSON.stringify(payload));
}

export async function clearStoredToken(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(getTokenStorageKey());
  await context.secrets.delete('reactpress.token');
}
