import { afterEach, describe, expect, it } from "vitest";
import { getRouteFromHash } from "../app/routes";

const setHash = (hash: string) => {
    window.history.replaceState(null, "", `/${hash}`);
};

afterEach(() => setHash(""));

describe("Playground routes", () => {
    it("opens the empty Playground route", () => {
        setHash("#playground");

        expect(getRouteFromHash([])).toEqual({
            kind: "playground",
            encodedLesson: null,
            payloadError: null,
        });
    });

    it("reads one lesson parameter and rejects duplicate or unknown parameters", () => {
        setHash("#playground?lesson=eyJpZCI6MX0");
        expect(getRouteFromHash([])).toMatchObject({
            kind: "playground",
            encodedLesson: "eyJpZCI6MX0",
            payloadError: null,
        });

        setHash("#playground?lesson=one&lesson=two");
        expect(getRouteFromHash([])).toMatchObject({ kind: "playground", payloadError: expect.any(String) });

        setHash("#playground?other=value");
        expect(getRouteFromHash([])).toMatchObject({ kind: "playground", payloadError: expect.any(String) });
    });
});