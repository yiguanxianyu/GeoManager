import mapboxgl, {
  type Map as MapboxMap,
  type MapboxOptions,
  type StyleSpecification,
} from "mapbox-gl";
import type { GeoJsonGeometry } from "../types";
import { extractCoordinates } from "../utils/geometry";
import { upsertPolygonLayer } from "./spatialDraw";
import {
  bindPlatformSymbolImageFallback,
  registerPlatformSymbolImages,
} from "./symbolImages";

const webMercatorTileSize = 512;
const exportPaddingCssPx = 32;
const minExportCssDimension = 320;
const maxExportDimension = 8192;
const maxExportPixels = 36_000_000;
const minMercatorLatitude = -85.05112878;
const maxMercatorLatitude = 85.05112878;
const exportRangeSourceId = "map-export-range";
const exportRangeFillId = "map-export-range-fill";
const exportRangeLineId = "map-export-range-line";

export interface MapPngExportOptions {
  dpi: number;
  tileZoom: number;
  accessToken?: string;
}

export interface MapRangeExportPlan {
  center: [number, number];
  cssWidth: number;
  cssHeight: number;
  outputWidth: number;
  outputHeight: number;
  dpi: number;
  tileZoom: number;
}

export async function exportMapRangePng(
  map: MapboxMap,
  geometry: GeoJsonGeometry,
  options: MapPngExportOptions,
): Promise<Blob> {
  const plan = createMapRangeExportPlan(geometry, options);
  const container = createExportContainer(plan);
  const exportStyle = cloneStyleFor2d(map.getStyle());
  let exportMap: MapboxMap | null = null;
  let unbindSymbolFallback: (() => void) | null = null;

  document.body.appendChild(container);
  try {
    const mapOptions: MapboxOptions = {
      container,
      style: exportStyle,
      center: plan.center,
      zoom: plan.tileZoom,
      pitch: 0,
      bearing: 0,
      projection: "mercator",
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      performanceMetricsCollection: false,
      fadeDuration: 0,
      localIdeographFontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    };
    if (options.accessToken) {
      mapOptions.accessToken = options.accessToken;
    }

    exportMap = new mapboxgl.Map(mapOptions);
    unbindSymbolFallback = bindPlatformSymbolImageFallback(exportMap);
    await waitForStyleLoad(exportMap);
    registerPlatformSymbolImages(exportMap);
    exportMap.setProjection("mercator");
    exportMap.jumpTo({
      center: plan.center,
      zoom: plan.tileZoom,
      pitch: 0,
      bearing: 0,
    });
    upsertPolygonLayer(
      exportMap,
      exportRangeSourceId,
      exportRangeFillId,
      exportRangeLineId,
      geometry,
      {
        fillColor: "#ef4444",
        fillOpacity: 0.14,
        lineColor: "#ef4444",
        lineOpacity: 1,
        lineWidth: 3,
      },
    );
    await waitForMapIdle(exportMap, 6000);
    await nextAnimationFrame();
    return await mapCanvasToPngBlob(exportMap.getCanvas(), plan);
  } finally {
    unbindSymbolFallback?.();
    exportMap?.remove();
    container.remove();
  }
}

export function createMapRangeExportPlan(
  geometry: GeoJsonGeometry,
  options: MapPngExportOptions,
): MapRangeExportPlan {
  const dpi = normalizeDpi(options.dpi);
  const tileZoom = normalizeTileZoom(options.tileZoom);
  const bounds = geometryBounds(geometry);
  const projected = projectBounds(bounds, tileZoom);
  const contentWidth = Math.max(1, projected.maxX - projected.minX);
  const contentHeight = Math.max(1, projected.maxY - projected.minY);
  const cssWidth = Math.ceil(
    Math.max(minExportCssDimension, contentWidth + exportPaddingCssPx * 2),
  );
  const cssHeight = Math.ceil(
    Math.max(minExportCssDimension, contentHeight + exportPaddingCssPx * 2),
  );
  const outputWidth = Math.round((cssWidth * dpi) / 96);
  const outputHeight = Math.round((cssHeight * dpi) / 96);
  validateOutputSize(outputWidth, outputHeight);
  const center = unprojectMercatorPixel(
    [
      (projected.minX + projected.maxX) / 2,
      (projected.minY + projected.maxY) / 2,
    ],
    tileZoom,
  );

  return {
    center,
    cssWidth,
    cssHeight,
    outputWidth,
    outputHeight,
    dpi,
    tileZoom,
  };
}

export function addPngDpiMetadata(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isPng(bytes)) {
    return bytes;
  }
  const chunk = createPhysChunk(normalizeDpi(dpi));
  const parts: Uint8Array[] = [bytes.slice(0, 8)];
  let inserted = false;
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) {
      return bytes;
    }
    const type = chunkType(bytes, offset + 4);
    const current = bytes.slice(offset, end);
    offset = end;

    if (type === "pHYs") {
      continue;
    }
    parts.push(current);
    if (type === "IHDR") {
      parts.push(chunk);
      inserted = true;
    }
    if (type === "IEND") {
      break;
    }
  }

  if (!inserted) {
    return bytes;
  }
  return concatBytes(parts);
}

function cloneStyleFor2d(style: StyleSpecification): StyleSpecification {
  const next = JSON.parse(JSON.stringify(style)) as StyleSpecification;
  next.projection = { name: "mercator" };
  return next;
}

function geometryBounds(geometry: GeoJsonGeometry) {
  const coordinates: Array<[number, number]> = [];
  extractCoordinates(geometry.coordinates, coordinates);
  if (coordinates.length === 0) {
    throw new Error("导出范围无有效坐标");
  }

  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  for (const [lng, lat] of coordinates) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  }
  if (![west, south, east, north].every(Number.isFinite)) {
    throw new Error("导出范围无有效坐标");
  }
  return {
    west,
    south: clamp(south, minMercatorLatitude, maxMercatorLatitude),
    east,
    north: clamp(north, minMercatorLatitude, maxMercatorLatitude),
  };
}

function projectBounds(
  bounds: { west: number; south: number; east: number; north: number },
  zoom: number,
) {
  const southWest = projectMercatorPixel([bounds.west, bounds.south], zoom);
  const northEast = projectMercatorPixel([bounds.east, bounds.north], zoom);
  return {
    minX: Math.min(southWest[0], northEast[0]),
    maxX: Math.max(southWest[0], northEast[0]),
    minY: Math.min(southWest[1], northEast[1]),
    maxY: Math.max(southWest[1], northEast[1]),
  };
}

function projectMercatorPixel([lng, lat]: [number, number], zoom: number) {
  const worldSize = webMercatorTileSize * 2 ** zoom;
  const clampedLat = clamp(lat, minMercatorLatitude, maxMercatorLatitude);
  const sinLatitude = Math.sin((clampedLat * Math.PI) / 180);
  return [
    ((lng + 180) / 360) * worldSize,
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      worldSize,
  ] as [number, number];
}

function unprojectMercatorPixel(
  [x, y]: [number, number],
  zoom: number,
): [number, number] {
  const worldSize = webMercatorTileSize * 2 ** zoom;
  const lng = (x / worldSize) * 360 - 180;
  const mercatorY = Math.PI * (1 - (2 * y) / worldSize);
  const lat = (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI;
  return [lng, lat];
}

function createExportContainer(plan: MapRangeExportPlan) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-100000px";
  container.style.top = "0";
  container.style.width = `${plan.cssWidth}px`;
  container.style.height = `${plan.cssHeight}px`;
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  return container;
}

async function mapCanvasToPngBlob(
  source: HTMLCanvasElement,
  plan: MapRangeExportPlan,
) {
  const output = document.createElement("canvas");
  output.width = plan.outputWidth;
  output.height = plan.outputHeight;
  const context = output.getContext("2d");
  if (!context) {
    throw new Error("浏览器不支持地图导出画布");
  }
  context.drawImage(source, 0, 0, plan.outputWidth, plan.outputHeight);
  const blob = await canvasToPngBlob(output);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const pngBytes = addPngDpiMetadata(bytes, plan.dpi);
  const pngBuffer = new ArrayBuffer(pngBytes.byteLength);
  new Uint8Array(pngBuffer).set(pngBytes);
  return new Blob([pngBuffer], {
    type: "image/png",
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("地图导出失败，请检查底图和瓦片服务是否允许导出"));
      }
    }, "image/png");
  });
}

function waitForStyleLoad(map: MapboxMap) {
  return new Promise<void>((resolve) => {
    if (map.isStyleLoaded()) {
      resolve();
      return;
    }
    map.once("style.load", () => resolve());
  });
}

function waitForMapIdle(map: MapboxMap, timeoutMs: number) {
  return new Promise<void>((resolve) => {
    let timeoutId: number | null = null;
    const finish = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      map.off("idle", finish);
      resolve();
    };
    timeoutId = window.setTimeout(finish, timeoutMs);
    map.once("idle", finish);
  });
}

function nextAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function normalizeDpi(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("DPI 参数无效");
  }
  return Math.round(clamp(value, 72, 600));
}

function normalizeTileZoom(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("瓦片等级参数无效");
  }
  return Math.round(clamp(value, 0, 22));
}

function validateOutputSize(width: number, height: number) {
  if (
    width > maxExportDimension ||
    height > maxExportDimension ||
    width * height > maxExportPixels
  ) {
    throw new Error("导出图片尺寸过大，请降低 DPI 或瓦片等级后重试");
  }
}

function createPhysChunk(dpi: number) {
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const type = new TextEncoder().encode("pHYs");
  const data = new Uint8Array(9);
  writeUint32(data, 0, pixelsPerMeter);
  writeUint32(data, 4, pixelsPerMeter);
  data[8] = 1;
  const chunk = new Uint8Array(4 + type.length + data.length + 4);
  writeUint32(chunk, 0, data.length);
  chunk.set(type, 4);
  chunk.set(data, 8);
  writeUint32(chunk, 8 + data.length, crc32(chunk.slice(4, 8 + data.length)));
  return chunk;
}

function isPng(bytes: Uint8Array) {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function chunkType(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(
    bytes[offset] ?? 0,
    bytes[offset + 1] ?? 0,
    bytes[offset + 2] ?? 0,
    bytes[offset + 3] ?? 0,
  );
}

function readUint32(bytes: Uint8Array, offset: number) {
  return (
    ((bytes[offset] ?? 0) * 0x1000000 +
      ((bytes[offset + 1] ?? 0) << 16) +
      ((bytes[offset + 2] ?? 0) << 8) +
      (bytes[offset + 3] ?? 0)) >>>
    0
  );
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function concatBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
