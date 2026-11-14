import * as vscode from 'vscode';

import { ReactPressCodeLensProvider } from './codelens/provider';
import { registerCommands } from './commands';
import { registerPasteUpload } from './pasteUpload';
import { ReactPressStatusBar } from './statusBar';

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = new ReactPressStatusBar(context);
  const codeLens = new ReactPressCodeLensProvider();

  registerCommands(context, statusBar);
  registerPasteUpload(context);

  context.subscriptions.push(
    codeLens,
    vscode.languages.registerCodeLensProvider({ language: 'markdown' }, codeLens),
    vscode.window.onDidChangeActiveTextEditor(() => {
      statusBar.scheduleRefresh({ debounceMs: 100 });
      codeLens.refresh();
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId === 'markdown') {
        codeLens.refresh();
        statusBar.scheduleRefresh({ debounceMs: 150 });
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('reactpress')) {
        statusBar.scheduleRefresh({ invalidateTokenCache: true });
        codeLens.refresh();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      statusBar.scheduleRefresh({ invalidateTokenCache: true });
      codeLens.refresh();
    })
  );

  statusBar.scheduleRefresh();
}

export function deactivate(): void {
  // no-op
}
