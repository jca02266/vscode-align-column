import * as assert from 'assert';
import { rawListeners } from 'process';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import * as jsu from '../../js-utils';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    suite('test1', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw Error("Failed to setup activeTextEditor");
        }
        const wholeText = `|a1,  a2 a3|
                           |b1, b2  b3|
                           |c1   , c2  c3|
                           | d1,  d2  d3  |`.replace(/^ *\||\|$/mg, "");
        setup(async () => {
            await editor.edit(edit => {
                const pos = new vscode.Position(0, 0);
                for (const [i, line] of wholeText.split("\n").entries()) {
                    edit.insert(new vscode.Position(i, 0), line + "\n");
                }
            });
            editor.selections = [
                new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(4, 0))
            ];
        });
        teardown(async () => {
            await editor.edit(edit => {
                const body = editor.document.getText();
                const pos = new vscode.Position(0, 0);
                const pos2 = editor.document.positionAt(body.length);
                edit.delete(new vscode.Range(pos, pos2))
            });
        });

        test('simple check line', () => {
            const pos = new vscode.Position(0, 0);
            const line = editor.document.lineAt(pos).text;
            assert.strictEqual("a1,  a2 a3", line);
        });
        test('simple check body', () => {
            const body = editor.document.getText();
            assert.strictEqual(wholeText + "\n", body);
        });
    });
});
