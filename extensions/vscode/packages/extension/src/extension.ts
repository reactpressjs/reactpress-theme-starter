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
    vscode.languages.registerCodeLensProvider({ language: 'markdown' }, codeLens),
    vscode.window.onDidChangeActiveTextEditor(() => {
      void statusBar.refresh();
      codeLens.refresh();
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId === 'markdown') {
        codeLens.refresh();
        void statusBar.refresh();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('reactpress')) {
        void statusBar.refresh();
        codeLens.refresh();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void statusBar.refresh();
      codeLens.refresh();
    })
  );

  void statusBar.refresh();
}

export function deactivate(): void {
  // no-op
}
