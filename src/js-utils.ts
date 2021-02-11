export function* range(n: number) {
    for (let i = 0; i < n; i++) {
        yield i;
    }
}

export function* zip<T>(a: T[], b: T[]) {
    const length = (() => {
        if (a.length >= b.length) {
            return a.length;
        } else {
            return b.length;
        }
    })();

    for (let i = 0; i < length; i++) {
        yield [a[i], b[i]];
    }
}

declare global {
    interface Array<T> {
        minIndex(fn: (v: T) => number): number | undefined
        maxIndex(fn: (v: T) => number): number | undefined
        min(fn: (v: T) => number): T
        max(fn: (v: T) => number): T
        groupBy<K, T>(
            getKey: (cur: T, idx: number, src: readonly T[]) => K): [K, T[]][]
    }
}

Array.prototype.groupBy = function<K, T>(
    getKey: (cur: T, idx: number, src: readonly T[]) => K
): [K, T[]][] {
    return Array.from(
        this.reduce((map, cur, idx, src) => {
            const key = getKey(cur, idx, src);
            const list = map.get(key);
            if (list) {
                list.push(cur);
            } else {
                map.set(key, [cur]);
            }
            return map;
        }, new Map<K, T[]>())
    );
};

Array.prototype.minIndex = function (fn: <T>(v: T) => number): number | undefined {
    if (this.length < 1) {
        return;
    }

    let index = 0;
    let min = fn(this[index]);

    for (let i = 1; i < this.length; i++) {
        let tmp = fn(this[i]);
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

    let index = 0;
    let max = fn(this[index]);

    for (let i = 1; i < this.length; i++) {
        let tmp = fn(this[i]);
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
};

Array.prototype.max = function (fn: (v: any) => number): any | undefined {
    const i = this.maxIndex(fn);
    if (i !== undefined) {
        return this[i];
    }
};

declare global {
    interface String {
        indexChar(s: string, index?: number): number
        indexNonSpace(index?: number): number
        splice(start: number, delCount: number, newSubStr: string): string
    }
}

String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

String.prototype.indexNonSpace = function (index: number = 0): number {
    for (let i = index; i < this.length; i++) {
        if (this.charAt(i) !== ' ') {
            return i;
        }
    }
    return -1;
};

// return most left index searchChars from this.
// return -1 if not found
String.prototype.indexChar = function (searchChars: string, from: number = 0): number {
    let lastindex = Infinity;
    for (const c of [...searchChars]) {
        const i = this.indexOf(c, from);
        if (i >= 0) {
            lastindex = Math.min(i, lastindex);
        }
    }
    return isFinite(lastindex) ? lastindex : -1;
};
