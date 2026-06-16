export type MapBoundsTuple = readonly [number, number, number, number];

export interface FlatThumbnailTile {
  key: string;
  url: string;
  x: number;
  y: number;
  size: number;
}

export interface FlatThumbnailPlan {
  zoom: number;
  width: number;
  height: number;
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tiles: FlatThumbnailTile[];
}

const tileSize = 256;
const maxMercatorLatitude = 85.05112878;
const defaultMinZoom = 2;
const defaultMaxZoom = 12;
const defaultThumbnailAspectRatio = 320 / 112;
const defaultPaddingRatio = 1.18;

export function buildFlatThumbnailPlan(
  bounds: MapBoundsTuple,
  mapZoom: number,
  options: {
    minZoom?: number;
    maxZoom?: number;
    thumbnailAspectRatio?: number;
    paddingRatio?: number;
    tileBaseUrl?: string;
  } = {},
): FlatThumbnailPlan | null {
  const normalized = normalizeBounds(bounds);
  if (!normalized) return null;

  const minZoom = options.minZoom ?? defaultMinZoom;
  const maxZoom = options.maxZoom ?? defaultMaxZoom;
  const targetZoom = clamp(
    Math.floor(Number.isFinite(mapZoom) ? mapZoom : minZoom) - 2,
    minZoom,
    maxZoom,
  );

  return buildPlanAtZoom(
    normalized,
    targetZoom,
    options.tileBaseUrl ?? "https://tile.openstreetmap.org",
    options.thumbnailAspectRatio ?? defaultThumbnailAspectRatio,
    options.paddingRatio ?? defaultPaddingRatio,
  );
}

function buildPlanAtZoom(
  bounds: NormalizedBounds,
  zoom: number,
  tileBaseUrl: string,
  thumbnailAspectRatio: number,
  paddingRatio: number,
) {
  const tileCount = 2 ** zoom;
  const westX = lngToTileX(bounds.west, zoom);
  const eastX = lngToTileX(bounds.east, zoom);
  const northY = latToTileY(bounds.north, zoom);
  const southY = latToTileY(bounds.south, zoom);
  const westPx = westX * tileSize;
  const eastPx = eastX * tileSize;
  const northPx = northY * tileSize;
  const southPx = southY * tileSize;
  const viewWidth = Math.max(2, eastPx - westPx);
  const viewHeight = Math.max(2, southPx - northPx);
  const viewCenterX = westPx + viewWidth / 2;
  const viewCenterY = northPx + viewHeight / 2;
  const viewBox = centeredViewBox(
    viewCenterX,
    viewCenterY,
    viewWidth,
    viewHeight,
    thumbnailAspectRatio,
    paddingRatio,
  );

  const xStart = Math.floor(viewBox.x / tileSize);
  const xEnd = Math.max(
    xStart,
    Math.floor((viewBox.x + viewBox.width - Number.EPSILON) / tileSize),
  );
  const yStart = clamp(Math.floor(viewBox.y / tileSize), 0, tileCount - 1);
  const yEnd = clamp(
    Math.max(
      yStart,
      Math.floor((viewBox.y + viewBox.height - Number.EPSILON) / tileSize),
    ),
    0,
    tileCount - 1,
  );
  const tileOriginX = xStart * tileSize;
  const tileOriginY = yStart * tileSize;

  const tiles: FlatThumbnailTile[] = [];
  for (let x = xStart; x <= xEnd; x += 1) {
    for (let y = yStart; y <= yEnd; y += 1) {
      const wrappedX = wrapTileX(x, tileCount);
      tiles.push({
        key: `${zoom}/${x}/${y}`,
        url: `${tileBaseUrl}/${zoom}/${wrappedX}/${y}.png`,
        x: (x - xStart) * tileSize,
        y: (y - yStart) * tileSize,
        size: tileSize,
      });
    }
  }

  const width = (xEnd - xStart + 1) * tileSize;
  const height = (yEnd - yStart + 1) * tileSize;
  return {
    zoom,
    width,
    height,
    viewBox: {
      x: viewBox.x - tileOriginX,
      y: viewBox.y - tileOriginY,
      width: viewBox.width,
      height: viewBox.height,
    },
    viewRect: {
      x: westPx - tileOriginX,
      y: northPx - tileOriginY,
      width: viewWidth,
      height: viewHeight,
    },
    tiles,
  };
}

function centeredViewBox(
  centerX: number,
  centerY: number,
  viewWidth: number,
  viewHeight: number,
  aspectRatio: number,
  paddingRatio: number,
) {
  const safeAspectRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : defaultThumbnailAspectRatio;
  const safePaddingRatio =
    Number.isFinite(paddingRatio) && paddingRatio > 0
      ? paddingRatio
      : defaultPaddingRatio;
  let width = Math.max(viewWidth * safePaddingRatio, 12);
  let height = Math.max(viewHeight * safePaddingRatio, 12);

  if (width / height > safeAspectRatio) {
    height = width / safeAspectRatio;
  } else {
    width = height * safeAspectRatio;
  }

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

interface NormalizedBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

function normalizeBounds(bounds: MapBoundsTuple): NormalizedBounds | null {
  const [rawWest, rawSouth, rawEast, rawNorth] = bounds;
  if (
    ![rawWest, rawSouth, rawEast, rawNorth].every((value) =>
      Number.isFinite(value),
    )
  ) {
    return null;
  }

  const south = clamp(
    Math.min(rawSouth, rawNorth),
    -maxMercatorLatitude,
    maxMercatorLatitude,
  );
  const north = clamp(
    Math.max(rawSouth, rawNorth),
    -maxMercatorLatitude,
    maxMercatorLatitude,
  );
  const west = normalizeLongitude(rawWest);
  let east = normalizeLongitude(rawEast);
  if (east <= west) {
    east += 360;
  }
  if (north <= south || east <= west) {
    return null;
  }

  return { west, south, east, north };
}

function lngToTileX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function latToTileY(lat: number, zoom: number) {
  const clamped = clamp(lat, -maxMercatorLatitude, maxMercatorLatitude);
  const radians = (clamped * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) *
    2 ** zoom
  );
}

function normalizeLongitude(lng: number) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

function wrapTileX(x: number, tileCount: number) {
  return ((x % tileCount) + tileCount) % tileCount;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
