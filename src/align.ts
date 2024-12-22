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

// Extract information about delimiters (XS: index, column, character)
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
        // No lines contain delimiters, or there is no need for alignment in a single line
        return undefined;
    }

    return xs;
}

export function alignBySeparator(lines: LineObject[], cstr: string): string {
    let xs;
    while ((xs = getColumnInfo1(lines, cstr)) !== undefined) {
        // Retrieve the Most-left delimiter
        var mlchar = xs.min(function (v: XS): number { return v.column; }).char; // Most-left delimiter

        // Retrieve the Most-right column that matches the character Most-left delimiter
        var mrcolumn = xs.max(function (v: XS): number {
            if (mlchar === v.char) {
                return v.column;
            }
            return -1;
        }).column;  // Most-right column

        // Align the position of the delimiter to the Most-right one
        var lenback = 0;
        if (mlchar.indexChar(",)]}") !== -1) {
          // Align after ,, ), ], or }
          lenback = 1;
        }

        xs.forEach(function (v) {
            if (v.char === mlchar && v.column <= mrcolumn) {
                const line = lines[v.idx];

                let index = line.lastindex;
                const spaceCount = mrcolumn - v.column;

                // Align the columns of delimiters
                let s = line.str.splice(index, 0, " ".repeat(spaceCount));

                // If the character following the delimiter is a space, remove it
                index += spaceCount + 1;
                let delCount = 0;
                while (s.charAt(index + delCount) === ' ') {
                    delCount++;
                }
                s = s.splice(index, delCount, "");

                lines[v.idx] = new LineObject(s, index);
            }
        });
    }
    return formatLine(lines);
}

// Extract information about delimiters (XS: index, column, character)
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
        // No lines contain delimiters, or there is no need for alignment in a single line
        return undefined;
    }
    return xs;
}

export function alignBySpace(lines: LineObject[]): string {
    let xs;
    while ((xs = getColumnInfo2(lines)) !== undefined) {
        // Retrieve the Most-right column that matches the space
        var mrcolumn = xs.max(function (v: XS): number {
            if (' ' !== v.char) {
                return v.column;
            }
            return -1;
        }).column;  // Most-right column

        xs.forEach(function (v) {
            if (v.char !== ' ' && v.column <= mrcolumn) {
                const line = lines[v.idx];

                const index = line.lastindex;
                const spaceCount = mrcolumn - v.column;

                // Align the columns of delimiters
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
    return lines.map((v) => v.str).join("\n");
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
