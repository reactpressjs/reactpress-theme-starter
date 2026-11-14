import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { ReactPressClient } from '@fecommunity/reactpress-content';

import { clearStoredToken, getApiUrl, getStoredToken, getUsername, setStoredToken } from './config';
import { assertHttpOrHttpsUrl, isLocalHostname } from './url-guards';

export async function getAuthenticatedClient(context: vscode.ExtensionContext): Promise<ReactPressClient> {
  const apiUrl = getApiUrl();
  const token = await getStoredToken(context);
  const client = new ReactPressClient({ apiUrl, token });

  if (!token) {
    throw new Error('Not connected. Run “ReactPress: Connect Site” first.');
  }

  return client;
}

export async function connectSite(context: vscode.ExtensionContext): Promise<void> {
  const apiUrl = await vscode.window.showInputBox({
    prompt: 'ReactPress API URL',
    value: getApiUrl(),
    ignoreFocusOut: true,
  });
  if (!apiUrl) return;

  const username = await vscode.window.showInputBox({
    prompt: 'Username',
    value: getUsername() || 'admin',
    ignoreFocusOut: true,
  });
  if (!username) return;

  const password = await vscode.window.showInputBox({
    prompt: 'Password',
    password: true,
    ignoreFocusOut: true,
  });
  if (!password) return;

  const normalizedApiUrl = apiUrl.replace(/\/+$/, '');
  const parsedApi = assertHttpOrHttpsUrl(normalizedApiUrl, 'API URL');
  if (!/\/api$/i.test(normalizedApiUrl)) {
    const cont = await vscode.window.showWarningMessage(
      'API URL usually ends with /api (e.g. http://localhost:3002/api). Continue anyway?',
      'Continue'
    );
    if (cont !== 'Continue') return;
  }
  if (parsedApi.protocol === 'http:' && !isLocalHostname(parsedApi.hostname)) {
    const cont = await vscode.window.showWarningMessage(
      'API URL uses plain HTTP outside localhost. Your login token may be exposed on the network. Continue anyway?',
      'Continue'
    );
    if (cont !== 'Continue') return;
  }

  await vscode.workspace
    .getConfiguration('reactpress')
    .update('apiUrl', normalizedApiUrl, vscode.ConfigurationTarget.Workspace);
  await vscode.workspace
    .getConfiguration('reactpress')
    .update('username', username, vscode.ConfigurationTarget.Workspace);

  const client = new ReactPressClient({ apiUrl: normalizedApiUrl });
  const result = await client.login({ name: username, password });
  await setStoredToken(context, result.token, normalizedApiUrl);
  vscode.window.showInformationMessage(`ReactPress connected (${normalizedApiUrl})`);
}

export async function disconnectSite(context: vscode.ExtensionContext): Promise<void> {
  await clearStoredToken(context);
  vscode.window.showInformationMessage('ReactPress disconnected');
}

export function createUploadLocalFile(client: ReactPressClient) {
  return async (absolutePath: string): Promise<string> => {
    const buffer = await fs.readFile(absolutePath);
    const blob = new Blob([Uint8Array.from(buffer)]);
    const uploaded = await client.uploadFile(blob, path.basename(absolutePath));
    return uploaded.url;
  };
}
