import * as vscode from 'vscode';
import { parseLocalDocument } from '@fecommunity/reactpress-content';

export class ReactPressCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.emitter.event;

  refresh(): void {
    this.emitter.fire();
  }

  dispose(): void {
    this.emitter.dispose();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (document.languageId !== 'markdown') {
      return [];
    }

    try {
      const parsed = parseLocalDocument(document.getText());
      if (!parsed.frontmatter.title) {
        return [];
      }
    } catch {
      return [];
    }

    const range = new vscode.Range(0, 0, 0, 0);
    return [
      new vscode.CodeLens(range, {
        title: 'Push',
        command: 'reactpress.pushDraft',
        arguments: [document.uri],
      }),
      new vscode.CodeLens(range, {
        title: 'Publish',
        command: 'reactpress.publish',
        arguments: [document.uri],
      }),
      new vscode.CodeLens(range, {
        title: 'Preview',
        command: 'reactpress.preview',
        arguments: [document.uri],
      }),
    ];
  }
}
