import * as assert from 'assert';
import * as jsu from '../js-utils';

suite('Extension Test Suite', () => {
    suite('js-utils', () => {
        test('range', () => {
            assert.deepStrictEqual([0, 1, 2], Array.from(jsu.range(3)));
        });
        test('zip', () => {
            assert.deepStrictEqual([[1,4], [2,5], [3,6]], Array.from(jsu.zip([1,2,3], [4,5,6])));
            assert.deepStrictEqual([[1,4], [2,5], [3,6], [undefined, 7]], Array.from(jsu.zip([1,2,3], [4,5,6,7])));
        });
    });
    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
});
