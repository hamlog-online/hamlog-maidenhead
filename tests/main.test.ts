import { describe, it, expect } from "vitest";

import { gridToPoint, pointToGrid, validateGrid } from "../src/index";

describe("Valid locators are valid", () => {
    for (const validCase of [
        "QN16",
        "QN",
        "QN16mm",
        "RR04KE33WO16WE57NA",
        "RR00",
        "RR00XX99AA00XX99",
    ]) {
        it(validCase, () => {
            expect(validateGrid(validCase)).toBe(true);
        });
    }
});

describe("Invalid locators are invalid", () => {
    for (const invalidCase of [
        "QN16n",
        "Q",
        "ZN",
        "AZ17",
        "ZN16",
        "QN1623",
        "QNffEE",
        "XN17",
        "QN16zm",
        "QN16mz",
    ]) {
        it(invalidCase, () => {
            expect(() => gridToPoint(invalidCase)).toThrowError(
                "not a valid Maidenhead"
            );
        });
    }
});

describe("Grids convert to correct points", () => {
    for (const validCase of [
        { g: "QN16", lat: 46.5, lon: 143.0 },
        { g: "QN16nn", lat: 46.5625, lon: 143.125 },
        { g: "QN16nn44", lat: 46.560417, lon: 143.120833 },
        { g: "RR99", lat: 89.5, lon: 179 },
        { g: "RR99xx99Xx99XX99", lat: 90, lon: 180 },
    ]) {
        it(validCase.g, () => {
            const point = gridToPoint(validCase.g);
            expect(point.lat).toBeCloseTo(validCase.lat, 6);
            expect(point.lon).toBeCloseTo(validCase.lon, 6);
        });
    }
});

describe("Points convert to reasonable grids", () => {
    for (const testCase of [
        { g: "FN42GV54AX", p: { lat: 42.895747, lon: -71.45816 } },
        { g: "RO92RB70LF", p: { lat: 52.042622, lon: 179.478993 } },
        { g: "RO91VX20VQ", p: { lat: 51.961173, lon: 179.774174 } },
    ]) {
        it(testCase.g, () => {
            expect(pointToGrid(testCase.p, 10)).toBe(testCase.g);
        });
    }
});

describe("Grid squares convert to points and back reversibly", () => {
    for (const testCase of [
        "QN",
        "QN16",
        "QN16MM",
        "QN16MM99",
        "QN16MM99AA",
        "RO91VX20MC",
        "FN42GV54AX",
        "FN42GV54AX55",
    ]) {
        it(testCase, () => {
            const point = gridToPoint(testCase);
            expect(pointToGrid(point, testCase.length)).toBe(testCase);
        });
    }
});

describe("Grids can be written in human-like manner when requested.", () => {
    for (const testCase of ["RO91vx20MC", "FN42gv54AX55cb"]) {
        it(testCase, () => {
            const point = gridToPoint(testCase);
            expect(pointToGrid(point, testCase.length, true)).toBe(testCase);
        });
    }

    it("rejects insane requests", () => {
        const point = gridToPoint("RO91vx20MC");
        expect(() => pointToGrid(point, 5)).toThrowError("even number");
    });
});
