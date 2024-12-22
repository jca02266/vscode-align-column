export class LineObject {
    str: string;
    lastindex: number;
    constructor(line: string, lastindex: number = 0) {
        this.str = line;
        this.lastindex = lastindex;
    }
}

export interface XS {
    idx: number
    column: number
    char: string
}

// 1. 区切り文字に関する情報(インデックス, サイズ(column), 文字(char))を抽出
export function getColumnInfo1(lines: LineObject[], cstr: string): XS[] | undefined {
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
            column: eastAsianWidth(lines[i].str, lines[i].lastindex),
            char: lines[i].str.charAt(lines[i].lastindex)
        });
    }

    if (xs.length <= 1) {
        // 区切り文字を含む行がない。または、1行で桁揃えの必要がない
        return undefined;
    }

    return xs;
}

export function alignBySeparator(lines: LineObject[], cstr: string): string {
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
    return formatLine(lines);
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
            column: eastAsianWidth(lines[i].str, lines[i].lastindex),
            char: lines[i].str.charAt(lines[i].lastindex)
        });
    }

    if (xs.length <= 1) {
        // 区切り文字を含む行がない。または、1行で桁揃えの必要がない
        return undefined;
    }
    return xs;
}

export function alignBySpace(lines: LineObject[]): string {
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
    return formatLine(lines);
}

function formatLine(lines: LineObject[]) {
    const length = lines.length;
    return lines.map((v, idx) => v.str + (idx === length - 1 ? '' : '\n')).join("");
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
