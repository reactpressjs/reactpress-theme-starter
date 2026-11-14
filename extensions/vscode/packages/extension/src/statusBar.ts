import * as vscode from 'vscode';
import { parseLocalDocument } from '@fecommunity/reactpress-content';

import { getStoredToken } from './config';

export class ReactPressStatusBar {
  private readonly item: vscode.StatusBarItem;
  private tokenPresent?: boolean;
  private refreshSeq = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'reactpress.connect';
    context.subscriptions.push(this.item);
  }

  /** Fire-and-forget refresh that never surfaces as an unhandled rejection. */
  scheduleRefresh(options?: { debounceMs?: number; invalidateTokenCache?: boolean }): void {
    if (options?.invalidateTokenCache) {
      this.tokenPresent = undefined;
    }
    const delay = options?.debounceMs ?? 0;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    if (delay <= 0) {
      void this.refresh().catch(() => undefined);
      return;
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.refresh().catch(() => undefined);
    }, delay);
  }

  async refresh(editor?: vscode.TextEditor): Promise<void> {
    const seq = ++this.refreshSeq;
    try {
      let connected = this.tokenPresent;
      if (connected === undefined) {
        const token = await getStoredToken(this.context);
        if (seq !== this.refreshSeq) return;
        connected = Boolean(token);
        this.tokenPresent = connected;
      }

      const active = editor ?? vscode.window.activeTextEditor;
      let statusLabel = 'offline';

      if (connected) {
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

      if (seq !== this.refreshSeq) return;

      this.item.text = `$(cloud-upload) ReactPress: ${statusLabel}`;
      this.item.tooltip = connected
        ? 'ReactPress connected — click to reconnect'
        : 'Click to connect ReactPress';
      this.item.show();
    } catch {
      // SecretStorage / parse failures must not crash the extension host.
    }
  }
}
