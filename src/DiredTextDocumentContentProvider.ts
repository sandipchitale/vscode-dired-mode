import * as vscode from "vscode";
import { TextDocument, TextEditor } from 'vscode';
import * as child_process from 'child_process';

export class DiredTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  static readonly DIRED = 'dired'

  // emitter and its event
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  private uri: vscode.Uri | undefined = undefined;
  private markedLines: Array<number> = [];

  private diredTextDocument: undefined | TextDocument;
  private diredTextEditor: undefined | TextEditor;

  private rawDiredBuffer = '';

  provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    return this.buffer(uri);
  }

  dispose(): any {
    this.diredTextDocument = undefined;
    this.diredTextEditor = undefined;

    this.onDidChangeEmitter.dispose();
  }

  buffer(uri: vscode.Uri) : Promise<string> {
    this.uri = uri;
    const dir = uri.path.substring(1);
    return new Promise((resolve, reject) => {
      if (this.rawDiredBuffer.length === 0) {
        const dirProcess = child_process.spawn(
          'cmd',
          [
            '/C'
            ,'dir'
            ,'/q'
            ,'/a'
            ,'/x'
          ],
          {
            cwd: dir
          }
        );

        dirProcess.stdout.on('data', (data) => {
          this.rawDiredBuffer += data;
        });

        dirProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
          reject(data);
        });

        dirProcess.on('exit', (code) => {
          resolve(this._processedDiredBuffer(this.rawDiredBuffer));
        });
      } else {
        resolve(this._processedDiredBuffer(this.rawDiredBuffer));
      }
    });
  }

  private _processedDiredBuffer(rawDiredBuffer: string): string {
    const diredBufferLines = rawDiredBuffer.split('\n');
    for (let i = 0; i < 5; i++) {
      diredBufferLines[i] = diredBufferLines[i].substring(1);
    }

    for (let i = 5; i < (diredBufferLines.length - 3); i++) {
      const lineNumberIndex = this.markedLines.indexOf(i);
      diredBufferLines[i] = `${lineNumberIndex === -1 ? ' ' : '*'} ${diredBufferLines[i]}`;
    }

    diredBufferLines[diredBufferLines.length-1] = diredBufferLines[diredBufferLines.length-2].trim();
    diredBufferLines[diredBufferLines.length-2] = diredBufferLines[diredBufferLines.length-3].trim();
    diredBufferLines[diredBufferLines.length-3] = '';
    return diredBufferLines.join('\n');
  }

  async open(dir: string) {
    this.rawDiredBuffer = '';
    this.markedLines = [];
    if (this.diredTextDocument) {
      vscode.window.showTextDocument(this.diredTextDocument, { preview: false }).then(() => {
        vscode.commands.executeCommand("workbench.action.closeActiveEditor").then(async () => {
          this._open(dir);
        });
      });
    } else {
      this._open(dir);
    }
  }

  async _open(dir: string) {
    const uri = vscode.Uri.parse(`dired:///${ dir }`);
    this.diredTextDocument = await vscode.workspace.openTextDocument(uri);
    vscode.languages.setTextDocumentLanguage(this.diredTextDocument, 'dired');
    this.diredTextEditor = await vscode.window.showTextDocument(this.diredTextDocument, { preview: false });
    this.diredTextEditor.options.insertSpaces = false;
    this.diredTextEditor.options.tabSize = 0;
    setTimeout(() => {
      this.diredTextEditor!.selection = new vscode.Selection(5, 77, 5, 77);
    }, 0);
  }

  isMarked(lineNumber: number): boolean {
    return (this.markedLines.indexOf(lineNumber) !== -1);
  }

  mark(lineNumber: number, advance = true) {
    const lineNumberIndex = this.markedLines.indexOf(lineNumber);
    if (lineNumberIndex === -1) {
      this.markedLines.push(lineNumber);
      this.refresh();
    if (advance) {
        this.next(lineNumber);
      }
    }
  }

  markAll() {
    this.markedLines = [];
    const lineCount = this.diredTextDocument!.lineCount;
    for (let i = 5; i < lineCount - 3; i++) {
      this.markedLines.push(i);
    }
    this.refresh();
    this._goto(5);
  }

  unmark(lineNumber: number, advance = true) {
    const lineNumberIndex = this.markedLines.indexOf(lineNumber);
    if (lineNumberIndex !== -1) {
      this.markedLines.splice(lineNumberIndex, 1);
      this.refresh();
      if (advance) {
        this.next(lineNumber);
      }
    }
  }

  unmarkAll() {
    this.markedLines = [];
    this.refresh();
    this._goto(5);
  }

  toggleMark(lineNumber: number) {
    if (this.isMarked(lineNumber)) {
      this.unmark(lineNumber, false);
    } else {
      this.mark(lineNumber, false);
    }
  }

  toggleMarkAll() {
    const lineCount = this.diredTextDocument!.lineCount;
    for (let i = 5; i < lineCount - 3; i++) {
      if (this.isMarked(i)) {
        this.unmark(i, false);
      } else {
        this.mark(i, false);
      }
    }
    this.refresh();
    this._goto(5);
  }

  next(lineNumber: number) {
    this._goto(lineNumber+1);
  }

  previous(lineNumber: number) {
    this._goto(lineNumber-1);
  }

  private _goto(lineNumber: number) {
    this.diredTextEditor!.selection = new vscode.Selection(lineNumber, 77, lineNumber, 77);
  }

  reload() {
    this.rawDiredBuffer = '';
    this.refresh();
  }

  refresh() {
    this.onDidChangeEmitter.fire(this.uri);
  }

  quit() {
    vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }

}
