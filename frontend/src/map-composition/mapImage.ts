import type { Map as MapboxMap } from "mapbox-gl";
import { exportMapRangeImage } from "../map/mapExport";
import type { GeoJsonGeometry } from "../types";
import type { MapBounds } from "./layout";

export async function renderBoundsImage(
  map: MapboxMap,
  bounds: MapBounds,
  targetWidth: number,
  targetHeight: number,
  accessToken?: string,
): Promise<ImageBitmap> {
  const tileZoom = tileZoomForTarget(bounds, targetWidth, targetHeight);
  const blob = await exportMapRangeImage(map, boundsGeometry(bounds), {
    dpi: 96,
    tileZoom,
    format: "png",
    accessToken,
  });
  return createImageBitmap(blob);
}

export function boundsGeometry(bounds: MapBounds): GeoJsonGeometry {
  const [west, south, east, north] = bounds;
  return {
    type: "Polygon",
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  };
}

export function tileZoomForTarget(
  bounds: MapBounds,
  targetWidth: number,
  targetHeight: number,
) {
  const [west, south, east, north] = bounds;
  const baseWidth = (Math.abs(east - west) / 360) * 512;
  const baseHeight = Math.abs(mercatorY(north) - mercatorY(south)) * 512;
  const widthRatio = targetWidth / Math.max(1, baseWidth);
  const heightRatio = targetHeight / Math.max(1, baseHeight);
  const zoom = Math.ceil(Math.log2(Math.max(widthRatio, heightRatio))) - 1;
  return Math.max(0, Math.min(22, zoom));
}

function mercatorY(latitude: number) {
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const radians = (clamped * Math.PI) / 180;
  return (
    (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2
  );
}
