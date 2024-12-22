import * as assert from 'assert';
import { rawListeners } from 'process';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import * as jsu from '../../js-utils';

function fixture(str: string) {
    let ret = str;

    // remove first empty line
    ret = ret.replace(/^\n+/, "");
    // remove last empty line
    ret = ret.replace(/ +$/, "");
    // return between "|" and "|"
    return ret.replace(/^ *\||\|$/mg, "");
}

async function setupEditor() {
    const document = await vscode.workspace.openTextDocument({ content: "" });
    await vscode.window.showTextDocument(document);
}

function getEditor(): vscode.TextEditor {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        throw Error("Failed to setup activeTextEditor");
    }
    return editor;
}

function startPos(): vscode.Position {
    return new vscode.Position(0, 0);
}

function endPos(editor: vscode.TextEditor): vscode.Position {
    const body = editor.document.getText();
    return editor.document.positionAt(body.length);
}

function wholeSelection(editor: vscode.TextEditor): vscode.Selection {
    return new vscode.Selection(startPos(), endPos(editor));
}

function wholeRange(editor: vscode.TextEditor): vscode.Range {
    const selection = wholeSelection(editor);
    return new vscode.Range(selection.start, selection.end);
}

function selectWholeText(editor: vscode.TextEditor) {
    editor.selection = wholeSelection(editor);
}

async function getEditorAndSetText(str: string): Promise<vscode.TextEditor> {
    const editor = getEditor();
    await editor.edit(edit => {
        edit.insert(new vscode.Position(0, 0), str);
        editor.selections = [
            wholeSelection(editor)
        ];
    });
    return editor;
}

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    suite('test', () => {
        setup(async function() {
            this.timeout(5000);
            // delete whole text
            await setupEditor();
            const editor = getEditor();
            await editor.edit(edit => {
                edit.delete(wholeRange(editor));
            });
        });

        suite('simple test', () => {
            test('simple check line', async () => {
                const text = fixture(`|a1, a2, a3|`);
                const editor = await getEditorAndSetText(text);
                const line = editor.document.lineAt(startPos()).text;
                assert.strictEqual(line, "a1, a2, a3");
            });
            test('simple check body', async () => {
                const text = fixture(`
                    |a1, a2, a3|
                    |b1, b2, b3|
                    `);
                const editor = await getEditorAndSetText(text);
                const body = editor.document.getText();
                assert.strictEqual(body, text);
            });
        });
        suite('align-columns.align', () => {
            test('align-columns.align by space', async () => {
                const text = fixture(`
                    |a1, a2, a3|
                    |b1,   b2, b3|
                    | b1, b2,  b3  |
                    `);
                const expect = fixture(`
                    | a1,   a2,  a3|
                    | b1,   b2,  b3|
                    | b1,   b2,  b3  |
                    `);

                const editor = await getEditorAndSetText(text);
                selectWholeText(editor);
                await myExtension.alignColumns(editor, " ");
                const body = editor.document.getText();
                assert.strictEqual(body, expect);
            });
            test('align-columns.align by comma', async () => {
                const text = fixture(`
                    |a1, a2, a3|
                    |b1,,   b2, b3|
                    | b1, b2,  b3  |
                    `);
                const expect = fixture(`
                    |a1 ,a2,a3|
                    |b1 ,  ,b2, b3|
                    | b1,b2,b3  |
                `);

                const editor = await getEditorAndSetText(text);
                selectWholeText(editor);
                await myExtension.alignColumns(editor, ",");
                const body = editor.document.getText();
                assert.strictEqual(body, expect);
            });
            test('align-columns.align by comma and equal', async () => {
                const text = fixture(`
                    |int a = 1, b = 2, c = 3;|
                    |char d = 'c', s[] = "abc";|
                    `);
                const expect = fixture(`
                    |int a  =1  ,b   =2, c = 3;|
                    |char d ='c',s[] ="abc";|
                `);

                const editor = await getEditorAndSetText(text);
                selectWholeText(editor);
                await myExtension.alignColumns(editor, ",=");
                const body = editor.document.getText();
                assert.strictEqual(body, expect);
            });
        });

    });
});
