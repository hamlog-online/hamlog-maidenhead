# Maidenhead grid conversion library

For various amateur radio needs, we at [Hamlog.Online](https://hamlog.online) required a library to process [Maidenhead grid locators](https://en.wikipedia.org/wiki/Maidenhead_Locator_System) in Javascript.

None of the other libraries already created by the community were suitable:

1. Some of them believe that Maidenhead grid locators are only ever 4 or 6 characters long, when situations exist that may require one to use 8 or even 10. Some will even reject either 4 or 6, which is downright unacceptable.
2. Some of them believe that if the grid isn't written in alternating upper and lower case, it's not valid, which is definitely not so.
3. Some will convert a grid to coordinates without noticing that they're pointing at the corner of the grid square.

This library was created to address all the above issues and work with arbitrary precision grids. If you want to give your coordinates down to a millimeter, you can.

## Usage

```bash
npm install @hamlog/maidenhead
```

If you're using TypeScript, you might want to use the TypeScript source code directly instead of the compiled versions:

```json
// tsconfig.json
...
    "paths": {
      "@hamlog/maidenhead": ["./node_modules/@hamlog/maidenhead/src"],
    }
...
```

## Examples

```ts
import {
  gridToPoint, pointToGrid, gridToBox
} from '@hamlog/maidenhead';

const coordinate = gridToPoint("FN42GV54AX");
// result: { lat: 42.895746527777774, lon: -71.45815972222222 }

const grid = pointToGrid(coordinate, 6);
// result: "FN42GV"

const gridNicer = pointToGrid(coordinate, 6, true);
// result: "FN42gv"

const box = gridToBox(grid);
// result: [ { lat: 42.875, lon: -71.5 }, { lat: 42.916666666666664, lon: -71.41666666666667 } ]
```

`gridToPoint` produces the coordinates of a point in the exact center of the grid square. `gridToBox` produces the coordinates of two corners of the grid square, suitable for drawing it on a map.

## Tooling

+ `npm run build` to build for consumption.

## License

This library is released under the terms of MIT license. See [LICENSE](LICENSE).
