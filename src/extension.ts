import * as vscode from 'vscode';
import './js-utils';
import * as vsc from './vsc-utils';

// For Tests

async function setUp() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        await editor.edit(edit => {
            edit.insert(new vscode.Position(0, 0), "a1,  a2 a3\n");
            edit.insert(new vscode.Position(1, 0), "b1, b2  b3\n");
            edit.insert(new vscode.Position(2, 0), "c1     ,  c2  c3\n");
            edit.insert(new vscode.Position(3, 0), " d1,  d2  d3  \n");

            // edit.insert(new vscode.Position(0, 0), "a1,  a2 a3\n");
            // edit.insert(new vscode.Position(1, 0), "b1, b2  b3\n");
            // edit.insert(new vscode.Position(2, 0), "c1     ,  c2  c3\n");
            // edit.insert(new vscode.Position(3, 0), "d1,  d2  d3  \n");

        });
        editor.selections = [
            new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(4, 0))
        ];
    }
}

class LineObject {
    str: string;
    lastindex: number;
    constructor(line: string, lastindex: number = 0) {
        this.str = line;
        this.lastindex = lastindex;
    }
}

interface XS {
    idx: number
    column: number
    char: string
}

// 1. 区切り文字に関する情報(インデックス, サイズ(column), 文字(char))を抽出
function getColumnInfo1(lines: LineObject[], cstr: string): XS[] | undefined {
    const xs: XS[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].lastindex < 0) {
            continue;
        }
        lines[i].lastindex = lines[i].str.indexChar(cstr, lines[i].lastindex);

        if (lines[i].lastindex < 0) {
            continue;
        }

        xs.push({
            idx: i,
            column: vsc.eastAsianWidth(lines[i].str, lines[i].lastindex),
            char: lines[i].str.charAt(lines[i].lastindex)
        });
    }

    if (xs.length <= 1) {
        // 区切り文字を含む行がない。または、1行で桁揃えの必要がない
        return undefined;
    }

    return xs;
}

function alignBySeparator(lines: LineObject[], cstr: string): string {
    let xs;
    while ((xs = getColumnInfo1(lines, cstr)) !== undefined) {
        // 2. 最左にある区切り文字を取得
        var mlchar = xs.min(function (v: XS): number { return v.column; }).char; // 最左文字(most-left-char)

        // 3. 2で取得した区切り文字と同じ文字で最右にあるものを取得
        var mrcolumn = xs.max(function (v: XS): number {
            if (mlchar === v.char) {
                return v.column;
            }
            return -1;
        }).column;  // 最右カラム(most-right-column)

        // 4. 区切り文字の位置を3の最右にそろえる
        var lenback = 0;
        if (mlchar.indexChar(",)]}") !== -1) {
          // , ) ] } の後を揃える
          lenback = 1;
        }

        xs.forEach(function (v) {
            if (v.char === mlchar && v.column <= mrcolumn) {
                const line = lines[v.idx];

                let index = line.lastindex;
                const spaceCount = mrcolumn - v.column;

                // 区切り文字の桁を揃える
                let s = line.str.splice(index, 0, " ".repeat(spaceCount));

                // (区切り文字の次の文字)が空白だったら詰める
                index += spaceCount + 1;
                let delCount = 0;
                while (s.charAt(index + delCount) === ' ') {
                    delCount++;
                }
                s = s.splice(index, delCount, "");

                line.lastindex += spaceCount + 1;
                lines[v.idx] = new LineObject(s, line.lastindex);
            }
        });
    }
    return lines.map(function (v) { return v.str + "\n"; }).join("");
}

// 1. 区切り文字に関する情報(インデックス, サイズ(column), 文字(char))を抽出
function getColumnInfo2(lines: LineObject[]): XS[] | undefined {
    const xs: XS[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].lastindex < 0) {
            continue;
        }
        lines[i].lastindex = lines[i].str.indexNonSpace(lines[i].lastindex);

        if (lines[i].lastindex < 0) {
            continue;
        }

        xs.push({
            idx: i,
            column: vsc.eastAsianWidth(lines[i].str, lines[i].lastindex),
            char: lines[i].str.charAt(lines[i].lastindex)
        });
    }

    if (xs.length <= 1) {
        // 区切り文字を含む行がない。または、1行で桁揃えの必要がない
        return undefined;
    }
    return xs;
}

function alignBySpace(lines: LineObject[]): string {
    let xs;
    while ((xs = getColumnInfo2(lines)) !== undefined) {
        // 3. 2で取得した区切り文字と同じ文字で最右にあるものを取得
        var mrcolumn = xs.max(function (v: XS): number {
            if (' ' !== v.char) {
                return v.column;
            }
            return -1;
        }).column;  // 最右カラム(most-right-column)

        xs.forEach(function (v) {
            if (v.char !== ' ' && v.column <= mrcolumn) {
                const line = lines[v.idx];

                const index = line.lastindex;
                const spaceCount = mrcolumn - v.column;

                // 区切り文字の桁を揃える
                let s = line.str.splice(index, 0, " ".repeat(spaceCount));

                line.lastindex += spaceCount + 1;
                while (line.lastindex < s.length && s.charAt(line.lastindex) !== ' ') {
                    line.lastindex++;
                }
                lines[v.idx] = new LineObject(s, line.lastindex);
            }
        });
    }
    return lines.map(function (v) { return v.str + "\n"; }).join("");
}

function eastAsianWidthAtPosition(editor: vscode.TextEditor, pos: vscode.Position): number {
    return vsc.eastAsianWidth(editor.document.lineAt(pos.line).text, pos.character);
}

async function alignMultiCursor(i: number, editor: vscode.TextEditor, selGroup: [number, vscode.Selection[]][], maxWidth: number)  {
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

function getSelectionGroup(editor: vscode.TextEditor): [number, vscode.Selection[]][] {
    return editor.selections.sort((a, b) => {
        const diff = a.active.line - b.active.line;
        if (diff !== 0) {
            return diff;
        }
        return a.active.character - b.active.character;
    }).groupBy<number, vscode.Selection>((v) => v.active.line);
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('align-columns.align', async () => {
            // for debugging
            // await setUp();
            const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            if (editor.selection.isEmpty) {
                vscode.window.showInformationMessage(`You should select multi lines`);
                return;
            }

            vscode.window.showInputBox({
                prompt: 'Input separator: ',
                value: ',=',
                validateInput: input => {
                    return input.length > 0 ? '' : 'input: separator or just a space';
                }
            }).then((value) => {
                if (value === undefined) {
                    // canceled
                    return;
                }

                const lines: LineObject[] = [];
                for (const line of vsc.eachTextInSelection(editor)) {
                    lines.push(new LineObject(line));
                }

                const newText = value.includes(' ') ?
                    alignBySpace(lines) :
                    alignBySeparator(lines, value);
                vsc.replaceSelection(editor, newText);
            });
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('align-columns.align-multi-cursor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

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
                await alignMultiCursor(i, editor, selGroup, maxWidth);
            }
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
