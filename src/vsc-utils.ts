import * as vscode from 'vscode';

export function* eachTextInSelection(editor: vscode.TextEditor) {
    // get the selected cursor selected row
    const selections = editor.selections

    for (const selection of selections) {
        // get the selected text through location information
        const text = editor.document.getText(selection);
        // divide every line currently selected
        const lines = text.split('\n')

        for (const line of lines) {
            yield line;
        }

    }
}

export async function replaceSelection(editor: vscode.TextEditor, newText: string) {
    await editor.edit(edit => {
        edit.replace(editor.selection, newText);
    });
}

function charWidth(s: string, index: number): 1|2 {
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

export function eastAsianWidth(s: string, len: number): number {
    let ret = 0;
    for (let i = 0; i < len; i++) {
        ret += charWidth(s, i);
    }
    return ret;
}

export function charCodeAt(document: vscode.TextDocument, position: vscode.Position): number {
    return document.lineAt(position.line).text.charCodeAt(position.character);
}
