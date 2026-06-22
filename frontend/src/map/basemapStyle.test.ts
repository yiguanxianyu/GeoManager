import { describe, expect, it } from "vitest";
import { sanitizeStyleNumericAssertions } from "./basemapStyle";

describe("basemapStyle", () => {
  it("adds fallback values to basemap number assertions", () => {
    const style = {
      version: 8,
      sources: {
        basemap: {
          type: "vector",
          url: "https://tiles.example.test/planet",
        },
      },
      layers: [
        {
          id: "road-label",
          type: "symbol",
          source: "basemap",
          "source-layer": "transportation_name",
          filter: [
            "all",
            ["has", "reflen"],
            ["<=", ["number", ["get", "reflen"]], 6],
            [
              "step",
              ["zoom"],
              ["==", ["geometry-type"], "Point"],
              11,
              [">", ["number", ["get", "len"]], 5000],
            ],
          ],
          layout: {
            "text-size": ["number", ["get", "size"]],
          },
        },
      ],
    } as const;

    const sanitized = sanitizeStyleNumericAssertions(style);
    const layer = sanitized.layers?.[0];

    expect(layer?.filter).toEqual([
      "all",
      ["has", "reflen"],
      ["<=", ["number", ["get", "reflen"], 0], 6],
      [
        "step",
        ["zoom"],
        ["==", ["geometry-type"], "Point"],
        11,
        [">", ["number", ["get", "len"], 0], 5000],
      ],
    ]);
    expect(layer?.layout?.["text-size"]).toEqual([
      "number",
      ["get", "size"],
      0,
    ]);
    expect(style.layers[0].filter[2]).toEqual([
      "<=",
      ["number", ["get", "reflen"]],
      6,
    ]);
  });
});
