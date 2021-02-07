import * as vscode from 'vscode';

// For Tests

async function setUp() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        await editor.edit(edit => {
            edit.insert(new vscode.Position(0, 0), "a1  a2 a3\n");
            edit.insert(new vscode.Position(1, 0), "b1 b2  b3\n");
            edit.insert(new vscode.Position(2, 0), "c1  c2  c3\n");
            edit.insert(new vscode.Position(3, 0), "  d1  d2  d3  \n");
        });
        editor.selections = [
            new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(4, 0))
        ];
    }
}

// Utilities

function* range(n: number) {
    for (let i = 0; i < n; i++) {
        yield i;
    }
}

function* zip<T>(a: T[], b: T[]) {
    const length = (() => {
        if (a.length >= b.length) {
            return a.length;
        } else {
            return b.length;
        }
    })();

    for (let i = 0; i < length; i++) {
        yield [a[i], b[i], i];
    }
}

function* eachTextInSelection() {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        return;
    }

    const startLine = editor.selection.start.line;
    const endLine = editor.selection.end.line;
    for (let line = startLine; line < endLine; line++) {
        const text = editor.document.lineAt(line).text;
        yield text;
    }
}

async function replaceSelection(newText: string) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        await editor.edit(edit => {
            edit.replace(editor.selection, newText);
        });
    }
}

// return lastTabStop
function decideTabStop() {
    const tabStop: number[] = [];
    let lastTabStop: number[] = [];
    for (const text of eachTextInSelection()) {
        const chars = [...text, "\n"];

        let tabIndex = 0;
        let lastChar = " ";
        for (const [i, c] of chars.entries()) {
            if (lastChar !== " " && c === " ") {
                lastChar = " ";
                continue;
            }
            if (lastChar === " " && c !== " ") {
                lastChar = "";
                tabStop[tabIndex] = i;
                tabIndex++;
            }
        }
        console.debug("tabStop", ...tabStop);
        if (lastTabStop.length === 0) {
            lastTabStop = [...tabStop];
        } else {
            for (const [a, b, i] of zip(tabStop, lastTabStop)) {
                if (b === undefined) {
                    lastTabStop[i] = a;
                }
                if (a > b) {
                    lastTabStop[i] = a;
                }
            }
        }
        console.debug("last   ", ...lastTabStop);
    }

    return lastTabStop;
}

function addTabStop(newChars: string[], tabStop: number[], tabIndex: number, i: number): [number, number] {
    const tab = tabStop[tabIndex];
    if (tab <= i) {
        return [i, tabIndex + 1];
    } else {
        for (const _ of range(tab - i)) {
            newChars.push(" ");
        }

        return [tab, tabIndex + 1];
    }
}

function alignColumn(tabStop: number[]) {
    console.debug("012345678901234567890");
    const lines = [];
    for (const text of eachTextInSelection()) {
        const chars = [...text];
        const newChars: string[] = [];

        let tabIndex = 0;
        let lastChar = " ";
        let offset = 0;

        // align beginning of line (add leading spaces)
        [offset, tabIndex] = addTabStop(newChars, tabStop, tabIndex, offset);

        for (const c of chars) {
            if (lastChar !== " " && c === " " || c === undefined) {
                lastChar = " ";
                [offset, tabIndex] = addTabStop(newChars, tabStop, tabIndex, offset);
                continue;
            }
            if (c !== " ") {
                lastChar = c;
                offset++;
                newChars.push(c);
            }
        }

        // align end of line (add trailing spaces)
        for (const i of range(tabStop.length - tabIndex)) {
            [offset, tabIndex] = addTabStop(newChars, tabStop, tabIndex, offset);
        }
        console.debug(newChars.join("") + "|");
        lines.push(newChars);
    }

    return lines;
}
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('align-columns.align', async () => {
            await setUp();

            const tabStop = decideTabStop();
            const lines = alignColumn(tabStop);
            replaceSelection(lines.map((line) => line.join("")).join("\n"));
        }));

}

export function deactivate() { }
