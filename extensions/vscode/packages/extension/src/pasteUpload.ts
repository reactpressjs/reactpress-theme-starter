import type * as vscode from 'vscode';

/**
 * Paste-to-upload is intentionally thin in v1.
 * Use “ReactPress: Upload Image” for reliable media insertion.
 */
export function registerPasteUpload(_context: vscode.ExtensionContext): void {
  // no-op in v0.1
}
