import * as vscode from 'vscode';
import * as path from 'path';

import { DiredTextDocumentContentProvider } from './DiredTextDocumentContentProvider';

export function activate({ subscriptions }: vscode.ExtensionContext) {
  // register a content provider for the cowsay-scheme
  const diredSchemeProvider = new DiredTextDocumentContentProvider();

  subscriptions.push(diredSchemeProvider);
  subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      DiredTextDocumentContentProvider.DIRED,
      diredSchemeProvider
    )
  );

  // register a command that opens dired buffer
  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired',
      async (editor) => {
        diredSchemeProvider.open(path.dirname(editor.document.uri.fsPath));
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.parent',
      async (editor) => {
        diredSchemeProvider.open(path.dirname(editor.document.uri.fsPath));
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.dired',
      async (editor) => {
        vscode.window;
        const lineNumber = editor.selection.start.line;
        const lineCount = editor.document.lineCount;
        if (lineNumber > 5 && lineNumber < lineCount - 3) {
          const lineText = editor.document.lineAt(lineNumber).text;
          const type = lineText.substring(26, 31);
          const dir = lineText.substring(77 );
          if (type === '<DIR>') {
            diredSchemeProvider.open(path.join(editor.document.uri.fsPath, dir));
          } else {
            const doc = await vscode.workspace.openTextDocument(
              path.join(editor.document.uri.fsPath, dir)
            );
            await vscode.window.showTextDocument(doc, { preview: false });
          }
        }
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.mark',
      async (editor) => {
        const lineNumber = editor.selection.start.line;
        const lineCount = editor.document.lineCount;
        if (lineNumber > 4 && lineNumber < lineCount - 3) {
          diredSchemeProvider.mark(lineNumber);
        }
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.mark-all',
      async (editor) => {
        diredSchemeProvider.markAll();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.unmark',
      async (editor) => {
        const lineNumber = editor.selection.start.line;
        const lineCount = editor.document.lineCount;
        if (lineNumber > 4 && lineNumber < lineCount - 3) {
          diredSchemeProvider.unmark(lineNumber);
        }
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.unmark-all',
      async (editor) => {
        diredSchemeProvider.unmarkAll();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.toggle-mark',
      async (editor) => {
        const lineNumber = editor.selection.start.line;
        const lineCount = editor.document.lineCount;
        if (lineNumber > 4 && lineNumber < lineCount - 3) {
          diredSchemeProvider.toggleMark(lineNumber);
        }
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.toggle-mark-all',
      async (editor) => {
        diredSchemeProvider.toggleMarkAll();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.previous',
      async (editor) => {
        const lineNumber = editor.selection.start.line;
        const lineCount = editor.document.lineCount;
        if (lineNumber > 5 && lineNumber < lineCount - 2) {
          diredSchemeProvider.previous(lineNumber);
        }
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.next',
      async (editor) => {
        const lineNumber = editor.selection.start.line;
        const lineCount = editor.document.lineCount;
        if (lineNumber > 4 && lineNumber < lineCount - 4) {
          diredSchemeProvider.next(lineNumber);
        }
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.refresh',
      async (editor) => {
        diredSchemeProvider.reload();
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'vscode-dired.quit',
      async (editor) => {
        diredSchemeProvider.quit();
      }
    )
  );

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && editor.document.uri.scheme === DiredTextDocumentContentProvider.DIRED) {
      editor.options = {
        cursorStyle: vscode.TextEditorCursorStyle.BlockOutline,
      };
      vscode.commands.executeCommand('setContext', 'vscode-dired', true);
    } else {
      vscode.commands.executeCommand('setContext', 'vscode-dired', false);
    }
  });
}
