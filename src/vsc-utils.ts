import * as vscode from 'vscode';

export function* eachTextInSelection(editor: vscode.TextEditor) {
    // get the selected cursor selected row
    const selections = editor.selections;

    for (const selection of selections) {
        // get the selected text through location information
        const text = editor.document.getText(selection);
        // divide every line currently selected
        const lines = text.split('\n');

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

export function charCodeAt(document: vscode.TextDocument, position: vscode.Position): number {
    return document.lineAt(position.line).text.charCodeAt(position.character);
}
