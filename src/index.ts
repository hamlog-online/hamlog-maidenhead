/**
 * Basic coordinate type, explicit so it's easier to interface it to other things that want coordinates.
 */
export interface LatLon {
    lat: number;
    lon: number;
}

/** A grid square is a tuple of points in two different corners of the square */
export type GridBox = [LatLon, LatLon];

/** A grid square string is just a string */
export type MaidenheadGrid = string;

// Never forget:
// + Latitude is +north -south,
// + Longitude is +east -west.

/**
 * Validate that a given string is a correct Maidenhead grid locator.
 *
 * This is more complicated than it sounds!
 *
 * A valid locator has no restrictions on letter case, despite the
 * popular usage. It has different restrictions for the first pair
 * of letters and for the subsequent pairs. It can actually be
 * extended indefinitely, even though with 12
 * characters you get into sub-millimeter precision. And the shortest
 * possible grid locator is actually 2 characters, and yes, this also
 * makes sense.
 *
 * @param grid Maidenhead locator
 * @returns true if the locator is valid
 */
export function validateGrid(grid: MaidenheadGrid): boolean {
    // Basic sanity checking.
    if (grid.length % 2 !== 0) return false;
    const thatGrid = grid.toLowerCase();
    if (!/^[a-x0-9]+$/.test(thatGrid)) return false;

    // A regexp to properly validate a grid is simply too cumbersome
    // compared to this logic.
    for (let i = 0; i < thatGrid.length; i += 2) {
        const pair = `${thatGrid[i]}${thatGrid[i + 1]}`;
        // First pair of characters must be within A-R range.
        if (i == 0) {
            if (!/[a-r]{2}/.test(pair)) {
                return false;
            }
        } else {
            if (i % 4 != 0) {
                // Any odd pair of characters must be digits.
                if (!/\d{2}/.test(pair)) {
                    return false;
                }
            } else {
                // Any even pair of characters except the first must be in the a-x range.
                if (!/[a-x]{2}/.test(pair)) {
                    return false;
                }
            }
        }
    }
    return true;
}

const a = 65; // "A".charCodeAt(0);
const o = 48; // "0".charCodeAt(0);

/** Convert a character to a numeric value it encodes.
 * @param c a single character string.
 * @returns the numeric value.
 */
function charToValue(c: string): number {
    let cv = c.charCodeAt(0);
    if (cv >= a) {
        return cv - a;
    }
    return cv - o;
}

/** Convert a number to the single character.
 * @param x Number to convert
 * @param letters If true, produce a letter, otherwise a digit.
 */
function valueToChar(x: number, letters: boolean): string {
    return String.fromCharCode(x + (letters ? a : o));
}

/**
 * Compute the position and size of the given Maidenhead grid square on a map.
 *
 * @param grid Grid to convert
 * @returns A {GridBox} with two corners describing the grid square.
 */
export function gridToBox(grid: MaidenheadGrid): GridBox {
    if (!validateGrid(grid)) {
        throw new SyntaxError(`"${grid}" is not a valid Maidenhead locator`);
    }
    const thatGrid = grid.toUpperCase();
    const pairs = thatGrid.length / 2;
    let lon = -90;
    let lat = -90;
    let res = 10;

    for (let i = 0; i < pairs; i++) {
        lon += res * charToValue(thatGrid[2 * i]);
        lat += res * charToValue(thatGrid[2 * i + 1]);

        // We do not alter the resolution for the last pair, because we need
        // it to determine the box size.
        if (i < pairs - 1) {
            if (i % 2 > 0) {
                res /= 24;
            } else {
                res /= 10;
            }
        }
    }
    lon *= 2;

    return [
        {
            lat: lat,
            lon: lon,
        },
        {
            lat: lat + res,
            lon: lon + res * 2,
        },
    ];
}

/**
 * Convert grid to a point. Unlike some people, we return the
 * center of the square instead of a corner.
 *
 * @param grid Grid to convert
 * @returns A {lat: ..., lon:... } of the point in the center of the grid square.
 */
export function gridToPoint(grid: MaidenheadGrid): LatLon {
    const box = gridToBox(grid);
    return {
        lat: (box[0].lat + box[1].lat) / 2,
        lon: (box[0].lon + box[1].lon) / 2,
    };
}

/** Humanize the grid representation: lowercase some letters for readability.
 * @param gs Grid string to humanize.
 * @returns Humanized grid string.
 */
function humanizeGrid(gs: string): string {
    let res = "";
    for (let i = 0; i < gs.length; i++) {
        res += [4, 5, 12, 13].includes(i)
            ? gs[i].toLowerCase()
            : gs[i].toUpperCase();
    }
    return res;
}

/**
 *
 * @param point Coordinates to convert
 * @param precision Number of characters in output, defaults to 6.
 * @param humanize Humanize the representation the way it is normally done, i.e. by lowercasing the odd pairs of letters.
 * @returns Maidenhead grid to the precision requested.
 */
export function pointToGrid(
    point: LatLon,
    precision: number = 6,
    humanize: boolean = false
): MaidenheadGrid {
    if (precision % 2 != 0) {
        throw SyntaxError(
            "Maidenhead grids are supposed to have an even number of characters."
        );
    }

    let grid = "";

    // In theory we should use the same algorithm,
    // but instead of stacking up lon and lat multiplied by reducing res,
    // divide lon and lat by the reducing res, passing on the remainder.

    let lon = point.lon / 2 + 90;
    let lat = point.lat + 90;
    let res = 10;

    // So, each i is a pair. It makes sense to handle at most 6 pairs, ever, on this planet.
    for (let i = 0; i <= 6; i++) {
        // First character in a pair is longitude, second is latitude.

        // Even pairs of characters are numbers, odd pairs are letters.
        const letters = i % 2 == 0;

        // So first we add the characters to the string.
        grid += valueToChar(Math.floor(lon / res), letters);
        grid += valueToChar(Math.floor(lat / res), letters);
        // Then we update the latitude and longitude counters...
        lon %= res;
        lat %= res;

        // Then we drill down the resolution before the next loop.
        if (i % 2 > 0) {
            res /= 24;
        } else {
            res /= 10;
        }
    }

    if (humanize) {
        grid = humanizeGrid(grid);
    }

    return grid.slice(0, precision);
}
