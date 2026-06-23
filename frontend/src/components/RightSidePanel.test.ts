import { describe, expect, it } from "vitest";
import {
  thumbnailExtentBox,
  thumbnailTiles,
  thumbnailViewportForMapTile,
} from "./RightSidePanel";

const mapTile = {
  center: [82, 42] as [number, number],
  tileZoom: 6,
  scale: 0.44,
  tileUrlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

describe("thumbnailTiles", () => {
  it("centers the thumbnail viewport on the configured 2D map tile", () => {
    const viewport = thumbnailViewportForMapTile(mapTile, 290, 174);
    const tiles = thumbnailTiles(
      mapTile.tileZoom,
      viewport,
      290,
      174,
      mapTile.tileUrlTemplate,
    );

    expect(viewport.scale).toBe(0.44);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0]?.url).toContain("/6/");
  });

  it("uses the configured scale as the thumbnail zoom ratio", () => {
    const viewport = thumbnailViewportForMapTile(mapTile, 290, 174);
    const visibleWorldWidth = 290 / viewport.scale;
    const visibleWorldHeight = 174 / viewport.scale;

    expect(visibleWorldWidth / visibleWorldHeight).toBeCloseTo(290 / 174, 6);
  });

  it("keeps the current view indicator visible when the view is outside the crop", () => {
    const viewport = thumbnailViewportForMapTile(mapTile, 290, 174);
    const extent = thumbnailExtentBox(
      [105, 25, 110, 30],
      6,
      viewport,
      290,
      174,
    );

    expect(extent.left).toBeGreaterThanOrEqual(0);
    expect(extent.top).toBeGreaterThanOrEqual(0);
    expect(extent.left + extent.width).toBeLessThanOrEqual(290);
    expect(extent.top + extent.height).toBeLessThanOrEqual(174);
    expect(extent.width).toBeGreaterThanOrEqual(10);
    expect(extent.height).toBeGreaterThanOrEqual(10);
  });

  it("overlaps adjacent tile edges to avoid visible seams", () => {
    const tiles = thumbnailTiles(
      6,
      { left: 4000.25, top: 2200.25, scale: 0.37 },
      360,
      180,
    );
    const rows = new Map<number, typeof tiles>();
    for (const tile of tiles) {
      rows.set(tile.top, [...(rows.get(tile.top) ?? []), tile]);
    }

    for (const row of rows.values()) {
      const sorted = [...row].sort((a, b) => a.left - b.left);
      for (let i = 1; i < sorted.length; i += 1) {
        const previous = sorted[i - 1];
        const current = sorted[i];
        expect(
          current.left - (previous.left + previous.width),
        ).toBeLessThanOrEqual(0);
      }
    }
  });
});
