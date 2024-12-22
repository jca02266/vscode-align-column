import * as vscode from 'vscode';
import './js-utils';
import * as vsc from './vsc-utils';
import * as align from './align';

function eastAsianWidthAtPosition(editor: vscode.TextEditor, pos: vscode.Position): number {
    return align.eastAsianWidth(editor.document.lineAt(pos.line).text, pos.character);
}

export async function alignColumns(editor: vscode.TextEditor, value: string) {
    const lines: align.LineObject[] = [];
    for (const line of vsc.eachTextInSelection(editor)) {
        lines.push(new align.LineObject(line));
    }

    const newText = value.includes(' ') && value.trim() === '' ?
        align.alignBySpace(lines) :
        align.alignBySeparator(lines, value);
    await vsc.replaceSelection(editor, newText);
}

function getSelectionGroup(editor: vscode.TextEditor): [number, vscode.Selection[]][] {
    return editor.selections.sort((a, b) => {
        const diff = a.active.line - b.active.line;
        if (diff !== 0) {
            return diff;
        }
        return a.active.character - b.active.character;
    }).groupBy<number, vscode.Selection>((v) => v.active.line);
}

async function _alignMultiCursor(i: number, editor: vscode.TextEditor, selGroup: [number, vscode.Selection[]][], maxWidth: number)  {
    for (const [, sels] of selGroup) {
        await editor.edit(edit => {
            const sel = sels[i];
            if (sel) {
                const col = maxWidth - eastAsianWidthAtPosition(editor, sel.active);
                edit.insert(new vscode.Position(sel.active.line, sel.active.character), " ".repeat(col));
            }
        }, {undoStopAfter: false, undoStopBefore: false});
    }
}

export async function alignMultiCursor(editor: vscode.TextEditor) {
    const selGroup = getSelectionGroup(editor);

    let maxNum = -1;
    for (const [, sels] of selGroup) {
        maxNum = Math.max(maxNum, sels.length);
    }

    for (let i = 0; i < maxNum; i++) {
        const selGroup = getSelectionGroup(editor);
        let maxWidth = -1;
        for (const [, sels] of selGroup) {
            maxWidth = Math.max(maxWidth, eastAsianWidthAtPosition(editor, sels[i].active));
        }
        await _alignMultiCursor(i, editor, selGroup, maxWidth);
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('align-columns.align', async () => {
            const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            if (editor.selection.isEmpty) {
                vscode.window.showInformationMessage(`You should select multi lines`);
                return;
            }

            const value = await vscode.window.showInputBox({
                prompt: 'Input separator: ',
                value: ',=',
                validateInput: input => {
                    return input.length > 0 ? '' : 'input: separator or just a space';
                }
            });

            if (value === undefined) {
                // canceled
                return;
            }
            await alignColumns(editor, value);
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('align-columns.align-multi-cursor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            await alignMultiCursor(editor);
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('align-columns.remove-spaces-after-cursor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const removeSpacesAfterCursor = async (selection: vscode.Selection) => {
                const pos = selection.active;
                let pos2 = pos.translate();
                while (vsc.charCodeAt(editor.document, pos2) <= 32) {
                    pos2 = pos2.translate(0, 1);
                }
                await editor.edit(edit => {
                    edit.delete(new vscode.Selection(pos, pos2));
                });
            };

            for (const selection of editor.selections) {
                await removeSpacesAfterCursor(selection);
            }
        }));
    }

export function deactivate() { }
