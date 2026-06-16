import type {
  ExpressionSpecification,
  Map as MapboxMap,
  StyleSpecification,
} from "mapbox-gl";
import type { Bootstrap } from "../types";

export type MapBasemapConfig = Bootstrap["map"];

export const mapboxSatelliteStyle =
  "mapbox://styles/mapbox/satellite-streets-v12";
export const osmChineseVectorStyle =
  "https://tiles.openfreemap.org/styles/liberty";
export const mapLabelLanguage = "zh-Hans";

export const chineseLabelExpression: ExpressionSpecification = [
  "coalesce",
  ["get", "name:zh-Hans"],
  ["get", "name:zh"],
  ["get", "name_zh-Hans"],
  ["get", "name_zh"],
  ["get", "name:nonlatin"],
  ["get", "name"],
];

export function applyChineseBasemapLanguage(map: MapboxMap) {
  map.setLanguage(mapLabelLanguage);

  const style = map.getStyle();
  for (const layer of style.layers ?? []) {
    if (
      layer.type !== "symbol" ||
      !layer.layout ||
      !("text-field" in layer.layout) ||
      !map.getLayer(layer.id)
    ) {
      continue;
    }

    const textField = JSON.stringify(layer.layout["text-field"]);
    if (!textField.includes("name")) continue;
    map.setLayoutProperty(layer.id, "text-field", chineseLabelExpression);
  }
}

const osmTileUrls = [
  "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
];

export function createOsmRasterStyle(
  sourceId = "osm-raster",
  layerId = "osm-raster",
): StyleSpecification {
  return {
    version: 8,
    sources: {
      [sourceId]: {
        type: "raster",
        tiles: osmTileUrls,
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: layerId,
        type: "raster",
        source: sourceId,
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

export function shouldUseMapboxBasemap(mapConfig: MapBasemapConfig) {
  return (
    Boolean(mapConfig.mapboxAccessToken) && mapConfig.defaultBasemap !== "osm"
  );
}

export function createBasemapStyle(
  mapConfig: MapBasemapConfig,
  options: {
    osmSourceId?: string;
    osmLayerId?: string;
  } = {},
) {
  if (shouldUseMapboxBasemap(mapConfig)) {
    return mapboxSatelliteStyle;
  }
  return createOsmRasterStyle(options.osmSourceId, options.osmLayerId);
}
