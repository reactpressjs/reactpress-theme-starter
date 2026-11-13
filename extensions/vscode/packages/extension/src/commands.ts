import * as path from 'path';
import * as vscode from 'vscode';
import {
  SyncConflictError,
  createLocalArticleFile,
  parseLocalDocument,
  previewUrl,
  publishFile,
  pullArticleToFile,
  pushFile,
} from '@fecommunity/reactpress-content';

import { connectSite, createUploadLocalFile, disconnectSite, getAuthenticatedClient } from './client';
import { getContentAbsoluteDir, getSiteUrl } from './config';
import type { ReactPressStatusBar } from './statusBar';

async function resolveMarkdownPath(uri?: vscode.Uri): Promise<string> {
  if (uri?.fsPath) {
    const open = vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === uri.fsPath);
    if (open?.isDirty) {
      await open.save();
    }
    return uri.fsPath;
  }
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    throw new Error('Open a Markdown article first');
  }
  if (editor.document.isDirty) {
    await editor.document.save();
  }
  return editor.document.uri.fsPath;
}

async function readLocalArticleMeta(
  uri?: vscode.Uri
): Promise<{ articleId?: string; filePath?: string }> {
  try {
    if (uri?.fsPath) {
      const filePath = await resolveMarkdownPath(uri);
      const text = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))).toString('utf8');
      const local = parseLocalDocument(text);
      return { articleId: local.frontmatter.id, filePath };
    }
  } catch {
    // fall through to active editor
  }

  const editor = vscode.window.activeTextEditor;
  if (editor?.document.languageId === 'markdown') {
    try {
      const local = parseLocalDocument(editor.document.getText());
      return { articleId: local.frontmatter.id, filePath: editor.document.uri.fsPath };
    } catch {
      // ignore non-reactpress markdown
    }
  }
  return {};
}

export function registerCommands(
  context: vscode.ExtensionContext,
  statusBar: ReactPressStatusBar
): void {
  const forcePushWithStatus = async (
    uri: vscode.Uri | undefined,
    status: 'draft' | 'publish'
  ): Promise<void> => {
    const filePath = await resolveMarkdownPath(uri);
    const client = await getAuthenticatedClient(context);
    const result = await pushFile(client, filePath, {
      force: true,
      status,
      uploadLocalFile: createUploadLocalFile(client),
    });
    vscode.window.showInformationMessage(
      status === 'publish'
        ? `Published ${result.article.id} (forced)`
        : `Force-pushed draft ${result.article.id}`
    );
  };

  const wrap = <T extends unknown[]>(
    fn: (...args: T) => Promise<void>,
    options?: { forceStatus?: 'draft' | 'publish' }
  ) => {
    return async (...args: T) => {
      try {
        await fn(...args);
        await statusBar.refresh();
      } catch (error) {
        if (error instanceof SyncConflictError) {
          const choice = await vscode.window.showWarningMessage(
            error.message,
            'Pull',
            'Force Push'
          );
          if (choice === 'Pull') {
            // Preserve the original target URI (CodeLens / explorer) — do not fall back to active editor only.
            await vscode.commands.executeCommand('reactpress.pull', ...(args as unknown[]));
          } else if (choice === 'Force Push') {
            const uri = args[0] as vscode.Uri | undefined;
            if (options?.forceStatus) {
              await forcePushWithStatus(uri, options.forceStatus);
            } else {
              await vscode.commands.executeCommand('reactpress.pushForce', ...(args as unknown[]));
            }
            await statusBar.refresh();
          }
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`ReactPress: ${message}`);
      }
    };
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'reactpress.connect',
      wrap(async () => {
        await connectSite(context);
      })
    ),
    vscode.commands.registerCommand(
      'reactpress.disconnect',
      wrap(async () => {
        await disconnectSite(context);
      })
    ),
    vscode.commands.registerCommand(
      'reactpress.newArticle',
      wrap(async () => {
        const title = await vscode.window.showInputBox({
          prompt: 'Article title',
          ignoreFocusOut: true,
        });
        if (!title) return;
        const dir = getContentAbsoluteDir();
        if (!dir) throw new Error('Open a workspace folder first');
        const created = await createLocalArticleFile(dir, title);
        const doc = await vscode.workspace.openTextDocument(created.filePath);
        await vscode.window.showTextDocument(doc);
      })
    ),
    vscode.commands.registerCommand(
      'reactpress.pushDraft',
      wrap(async (uri?: vscode.Uri) => {
        const filePath = await resolveMarkdownPath(uri);
        const client = await getAuthenticatedClient(context);
        const result = await pushFile(client, filePath, {
          status: 'draft',
          uploadLocalFile: createUploadLocalFile(client),
        });
        vscode.window.showInformationMessage(
          `Pushed draft ${result.article.id}${result.created ? ' (created)' : ''}`
        );
      }, { forceStatus: 'draft' })
    ),
    vscode.commands.registerCommand(
      'reactpress.publish',
      wrap(async (uri?: vscode.Uri) => {
        const filePath = await resolveMarkdownPath(uri);
        const client = await getAuthenticatedClient(context);
        const result = await publishFile(client, filePath, {
          uploadLocalFile: createUploadLocalFile(client),
        });
        vscode.window.showInformationMessage(`Published ${result.article.id}`);
      }, { forceStatus: 'publish' })
    ),
    vscode.commands.registerCommand(
      'reactpress.pushForce',
      wrap(async (uri?: vscode.Uri) => {
        const filePath = await resolveMarkdownPath(uri);
        const client = await getAuthenticatedClient(context);
        const result = await pushFile(client, filePath, {
          force: true,
          uploadLocalFile: createUploadLocalFile(client),
        });
        vscode.window.showInformationMessage(`Force-pushed ${result.article.id}`);
      })
    ),
    vscode.commands.registerCommand(
      'reactpress.pull',
      wrap(async (uri?: vscode.Uri) => {
        const client = await getAuthenticatedClient(context);
        const meta = await readLocalArticleMeta(uri);
        let articleId = meta.articleId;
        let currentPath = meta.filePath;

        if (!articleId) {
          articleId = await vscode.window.showInputBox({
            prompt: 'Remote article id',
            ignoreFocusOut: true,
          });
        }
        if (!articleId) return;

        const dir = getContentAbsoluteDir(uri ?? (currentPath ? vscode.Uri.file(currentPath) : undefined));
        if (!dir) throw new Error('Open a workspace folder first');
        const out = currentPath ?? path.join(dir, `${articleId}.md`);

        const result = await pullArticleToFile(client, articleId, out);
        const doc = await vscode.workspace.openTextDocument(result.filePath);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Pulled ${articleId}`);
      })
    ),
    vscode.commands.registerCommand(
      'reactpress.preview',
      wrap(async (uri?: vscode.Uri) => {
        const filePath = await resolveMarkdownPath(uri);
        const text = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))).toString('utf8');
        const doc = parseLocalDocument(text);
        if (!doc.frontmatter.id) {
          throw new Error('Article has no remote id yet. Push or Publish first.');
        }
        if (doc.frontmatter.status !== 'publish') {
          const cont = await vscode.window.showWarningMessage(
            'Article is still a draft. Theme preview usually requires publish.',
            'Open anyway'
          );
          if (cont !== 'Open anyway') return;
        }
        const url = previewUrl(getSiteUrl(), doc.frontmatter.id);
        await vscode.env.openExternal(vscode.Uri.parse(url));
      })
    ),
    vscode.commands.registerCommand(
      'reactpress.uploadImage',
      wrap(async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) throw new Error('Open a Markdown file first');
        const picked = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: { Images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] },
        });
        if (!picked?.[0]) return;
        const client = await getAuthenticatedClient(context);
        const url = await createUploadLocalFile(client)(picked[0].fsPath);
        await editor.edit((builder) => {
          builder.insert(editor.selection.active, `![${path.basename(picked[0].fsPath)}](${url})`);
        });
      })
    )
  );
}
