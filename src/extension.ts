import * as vscode from 'vscode';

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

declare global {
    interface Array<T> {
        minIndex(fn: (v: T) => number): number | undefined
        maxIndex(fn: (v: T) => number): number | undefined
        min(fn: (v: T) => number): T
        max(fn: (v: T) => number): T
    }
}

Array.prototype.minIndex = function (fn: <T>(v: T) => number): number | undefined {
    if (this.length < 1) {
        return;
    }

    var index = 0;
    var min = fn(this[index]);

    for (var i = 1; i < this.length; i++) {
        var tmp = fn(this[i]);
        if (tmp < min) {
            min = tmp;
            index = i;
        }
    }

    return index;
};

Array.prototype.maxIndex = function (fn: <T>(v: T) => number): number | undefined {
    if (this.length < 1) {
        return;
    }

    var index = 0;
    var max = fn(this[index]);

    for (var i = 1; i < this.length; i++) {
        var tmp = fn(this[i]);
        if (tmp > max) {
            max = tmp;
            index = i;
        }
    }

    return index;
};

Array.prototype.min = function (fn: (v: any) => number): any | undefined {
    const i = this.minIndex(fn);
    if (i !== undefined) {
        return this[i];
    }
}

Array.prototype.max = function (fn: (v: any) => number): any | undefined {
    const i = this.maxIndex(fn);
    if (i !== undefined) {
        return this[i];
    }
}

declare global {
    interface String {
        indexChar(s: string, index?: number): number
        indexNonSpace(index?: number): number
        splice(start: number, delCount: number, newSubStr: string): string
    }
}

String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
}

String.prototype.indexNonSpace = function (index: number = 0): number {
    for (let i = index; i < this.length; i++) {
        if (this.charAt(i) !== ' ') {
            return i;
        }
    }
    return -1;
}

// 文字列sの各文字のうち、最も左で見つかったインデックスを返す
String.prototype.indexChar = function (s: string, index: number = 0): number {
    let lastindex = -1;
    for (let i = 0; i < s.length; i++) {
        const v = this.indexOf(s.charAt(i), index);
        if (v >= 0 && (lastindex < 0 || v < lastindex)) {
            lastindex = v;
        }
    }
    return lastindex;
};

function bytesize(s: string, index: number): 1|2 {
    var codepoint = s.charCodeAt(index || 0);

    // ASCII
    if (codepoint < 0x100) {
        return 1;
    }

    // Halfwidth CJK punctuation, Halfwidth Katakana variants
    if (0xFF61 <= codepoint && codepoint <= 0xFF9F) {
        return 1;
    }

    return 2;
}

function bytewidth(s: string, len: number): number {
    let ret = 0;
    for (let i = 0; i < len; i++) {
        ret += bytesize(s, i);
    }
    return ret;
}

class LineObject {
    str: string
    lastindex: number
    constructor(line: string, lastindex: number = 0) {
        this.str = line;
        this.lastindex = lastindex;
    }
}

function alignBySeparator(cstr: string) {

    const lines: LineObject[] = []
    for (const line of eachTextInSelection()) {
        lines.push(new LineObject(line))
    }

    while (true) {
        // 1. 区切り文字に関する情報(インデックス, サイズ(column), 文字(char))を抽出
        interface XS {
            idx: number
            column: number
            char: string
        }
        const xs: XS[] = []
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
                column: bytewidth(lines[i].str, lines[i].lastindex),
                char: lines[i].str.charAt(lines[i].lastindex)
            });
        }

        if (xs.length <= 1) {
            // 区切り文字を含む行がない。または、1行で桁揃えの必要がない
            break;
        }

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

                var index = line.lastindex;
                var spaceCount = mrcolumn - v.column;

                // 区切り文字の桁を揃える
                let s = line.str.splice(index, 0, " ".repeat(spaceCount));

                // (区切り文字の次の文字)が空白だったら詰める
                index += spaceCount + 1;
                var delCount = 0;
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

function alignBySpace() {
    const cstr = " "

    const lines: LineObject[] = []
    for (const line of eachTextInSelection()) {
        lines.push(new LineObject(line))
    }

    while (true) {
        // 1. 区切り文字に関する情報(インデックス, サイズ(column), 文字(char))を抽出
        interface XS {
            idx: number
            column: number
            char: string
        }
        const xs: XS[] = []
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
                column: bytewidth(lines[i].str, lines[i].lastindex),
                char: lines[i].str.charAt(lines[i].lastindex)
            });
        }

        if (xs.length <= 1) {
            // 区切り文字を含む行がない。または、1行で桁揃えの必要がない
            break;
        }

        // 2. 最左にある区切り文字を取得
        var mlchar = xs.min(function (v: XS): number { return v.column; }).char; // 最左文字(most-left-char)

        // 3. 2で取得した区切り文字と同じ文字で最右にあるものを取得
        var mrcolumn = xs.max(function (v: XS): number {
            if (' ' !== v.char) {
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
            if (v.char !== ' ' && v.column <= mrcolumn) {
                const line = lines[v.idx];

                var index = line.lastindex;
                var spaceCount = mrcolumn - v.column;

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

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('align-columns.align', async () => {
            // await setUp();

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
                if (value.includes(' ')) {
                    replaceSelection(alignBySpace());
                } else {
                    replaceSelection(alignBySeparator(value));
                }
                // vscode.window.showInformationMessage(`Alined with <${value}>`);
            });
        }));
}

export function deactivate() { }
