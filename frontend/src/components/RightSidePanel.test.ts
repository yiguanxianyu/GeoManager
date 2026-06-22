import { describe, expect, it } from "vitest";
import {
  thumbnailExtentBox,
  thumbnailTileCoverage,
  thumbnailTiles,
  thumbnailViewportForBounds,
} from "./RightSidePanel";

const bounds = {
  west: 75,
  south: 40,
  east: 90,
  north: 45,
};

describe("thumbnailTiles", () => {
  it("uses full tiles that cover the configured geographic bounds", () => {
    const coverage = thumbnailTileCoverage(bounds, 6);

    expect(coverage.minTileX).toBeLessThanOrEqual(coverage.maxTileX);
    expect(coverage.minTileY).toBeLessThanOrEqual(coverage.maxTileY);
    expect(coverage.width).toBe(
      (coverage.maxTileX - coverage.minTileX + 1) * 256,
    );
    expect(coverage.height).toBe(
      (coverage.maxTileY - coverage.minTileY + 1) * 256,
    );
  });

  it("crops the stitched tile coverage to the canvas aspect ratio", () => {
    const viewport = thumbnailViewportForBounds(bounds, 290, 174);
    const visibleWorldWidth = 290 / viewport.scale;
    const visibleWorldHeight = 174 / viewport.scale;

    expect(visibleWorldWidth / visibleWorldHeight).toBeCloseTo(290 / 174, 6);
  });

  it("keeps the current view indicator visible when the view is outside the crop", () => {
    const viewport = thumbnailViewportForBounds(bounds, 290, 174);
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
