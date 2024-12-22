import * as assert from 'assert';
import * as jsu from '../js-utils';
import * as ailgn from '../align';

suite('Extension Test Suite', () => {
    suite('extension', () => {
        test('getColumnInfo1', () => {
            const lo: ailgn.LineObject[] = [
                new ailgn.LineObject('foo', 0),
                new ailgn.LineObject('bar', 0)];
            const xs: ailgn.XS[] | undefined = ailgn.getColumnInfo1(lo, ',');
            assert.strictEqual(xs, undefined);
        });
        test('getColumnInfo1', () => {
            const lo: ailgn.LineObject[] = [
                new ailgn.LineObject('fo,bar', 0),
                new ailgn.LineObject('baz.qux.', 0)];
            const xs = ailgn.getColumnInfo1(lo, ',.');
            assert(xs !== undefined, 'result is undefined');
            assert.strictEqual(xs.length, 2);
            assert.deepStrictEqual(xs[0], {idx: 0, column: 2, char: ','});
            assert.deepStrictEqual(xs[1], {idx: 1, column: 3, char: '.'});

            const mlchar = xs.min((v) => v.column).char;
            assert.strictEqual(mlchar, ',');

            const mrcolumn = xs.max((v) => (mlchar === v.char) ? v.column : -1).column;
            assert.strictEqual(mrcolumn, 2);
        });
    });
    suite('js-utils', () => {
        suite('array', () => {
            test('range', () => {
                assert.deepStrictEqual([0, 1, 2], Array.from(jsu.range(3)));
            });
            test('zip', () => {
                assert.deepStrictEqual([[1, 4], [2, 5], [3, 6]], Array.from(jsu.zip([1, 2, 3], [4, 5, 6])));
                assert.deepStrictEqual([[1, 4], [2, 5], [3, 6], [undefined, 7]],
                    Array.from(jsu.zip([1, 2, 3], [4, 5, 6, 7])));
            });
            test('minIndex', () => {
                assert.strictEqual(undefined, [].minIndex((v) => v));
                assert.strictEqual(1, [3, 1, 2].minIndex((v) => v));
                assert.strictEqual(0, [3, 1, 2].minIndex((v) => -v));
            });
            test('maxIndex', () => {
                assert.strictEqual(undefined, [].maxIndex((v) => v));
                assert.strictEqual(0, [3, 1, 2].maxIndex((v) => v));
                assert.strictEqual(1, [3, 1, 2].maxIndex((v) => -v));
            });
            test('min', () => {
                assert.strictEqual(undefined, [].min((v) => v));
                assert.strictEqual(1, [3, 1, 2].min((v) => v));
                assert.strictEqual(3, [3, 1, 2].min((v) => -v));
            });
            test('max', () => {
                assert.strictEqual(undefined, [].max((v) => v));
                assert.strictEqual(3, [3, 1, 2].max((v) => v));
                assert.strictEqual(1, [3, 1, 2].max((v) => -v));
            });
            test('groupBy', () => {
                assert.deepStrictEqual([
                    [true, [0, 2, 4, 6]],
                    [false, [1, 3, 5]]],
                    Array.from(jsu.range(7)).groupBy((v: number) => v % 2 === 0)
                );
            });
        });
        suite('string', () => {
            test('indexChar', () => {
                assert.strictEqual(1, "abcd".indexChar("bc"));
                assert.strictEqual(2, "abcd".indexChar("cd"));
                assert.strictEqual(-1, "abc".indexChar("d"));
                assert.strictEqual(2, "abc".indexChar("c", 2));
                assert.strictEqual(-1, "abc".indexChar("c", 3));
            });
            test('indexNonSpace', () => {
                assert.strictEqual(0, "ab cd".indexNonSpace());
                assert.strictEqual(-1, "".indexNonSpace());
                assert.strictEqual(-1, "   ".indexNonSpace());
                assert.strictEqual(1, "ab  cd".indexNonSpace(1));
                assert.strictEqual(4, "ab  cd".indexNonSpace(2));
                assert.strictEqual(5, "ab  cd".indexNonSpace(5));
                assert.strictEqual(-1, "ab  cd".indexNonSpace(6));
            });
            test('splice', () => {
                assert.strictEqual("abc", "abc".splice(0, 0, ""));
                assert.strictEqual("abc", "abc".splice(1, 0, ""));
                assert.strictEqual("Aabc", "abc".splice(0, 0, "A"));
                assert.strictEqual("aAbc", "abc".splice(1, 0, "A"));
                assert.strictEqual("ac", "abc".splice(1, 1, ""));
                assert.strictEqual("aBc", "abc".splice(1, 1, "B"));
            });
        });
    });
});
