import * as vscode from 'vscode';
import { parseLocalDocument } from '@fecommunity/reactpress-content';

import { getStoredToken } from './config';

export class ReactPressStatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'reactpress.connect';
    context.subscriptions.push(this.item);
  }

  async refresh(editor?: vscode.TextEditor): Promise<void> {
    const token = await getStoredToken(this.context);
    const active = editor ?? vscode.window.activeTextEditor;
    let statusLabel = 'offline';

    if (token) {
      statusLabel = 'connected';
      if (active?.document.languageId === 'markdown') {
        try {
          const doc = parseLocalDocument(active.document.getText());
          if (doc.frontmatter.title) {
            statusLabel = `connected · ${doc.frontmatter.status}`;
          }
        } catch {
          // ignore non-reactpress markdown
        }
      }
    }

    this.item.text = `$(cloud-upload) ReactPress: ${statusLabel}`;
    this.item.tooltip = token ? 'ReactPress connected' : 'Click to connect ReactPress';
    this.item.show();
  }
}
