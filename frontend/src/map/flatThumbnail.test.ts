import { describe, expect, it } from "vitest";
import { buildFlatThumbnailPlan } from "./flatThumbnail";

describe("buildFlatThumbnailPlan", () => {
  it("creates an OSM tile plan for the current map bounds", () => {
    const plan = buildFlatThumbnailPlan([86.8, 41.2, 88.4, 42.1], 7.6, {
      tileBaseUrl: "https://tiles.example.test",
    });

    expect(plan).not.toBeNull();
    expect(plan?.zoom).toBe(5);
    expect(plan?.tiles.length).toBeGreaterThan(0);
    expect(plan?.tiles[0]?.url).toMatch(
      /^https:\/\/tiles\.example\.test\/5\/\d+\/\d+\.png$/,
    );
    expect(plan?.viewRect.width).toBeGreaterThan(2);
    expect(plan?.viewRect.height).toBeGreaterThan(2);
  });

  it("uses tiles two zoom levels below the main map zoom", () => {
    const plan = buildFlatThumbnailPlan([86.8, 41.2, 88.4, 42.1], 9.9);

    expect(plan?.zoom).toBe(7);
  });

  it("does not lower the thumbnail zoom based on tile count", () => {
    const plan = buildFlatThumbnailPlan([50, 35, 100, 48], 12);

    expect(plan).not.toBeNull();
    expect(plan?.zoom).toBe(10);
    expect(plan?.tiles.length).toBeGreaterThan(48);
  });

  it("centers the thumbnail viewBox on the current view rectangle", () => {
    const plan = buildFlatThumbnailPlan([86.8, 41.2, 88.4, 42.1], 9.9);

    expect(plan).not.toBeNull();
    if (!plan) return;

    const rectCenterX = plan.viewRect.x + plan.viewRect.width / 2;
    const rectCenterY = plan.viewRect.y + plan.viewRect.height / 2;
    const viewBoxCenterX = plan.viewBox.x + plan.viewBox.width / 2;
    const viewBoxCenterY = plan.viewBox.y + plan.viewBox.height / 2;

    expect(viewBoxCenterX).toBeCloseTo(rectCenterX, 8);
    expect(viewBoxCenterY).toBeCloseTo(rectCenterY, 8);
  });

  it("returns null for invalid bounds", () => {
    expect(buildFlatThumbnailPlan([87, 41, Number.NaN, 42], 7)).toBeNull();
    expect(buildFlatThumbnailPlan([87, 41, 88, 41], 7)).toBeNull();
  });
});
