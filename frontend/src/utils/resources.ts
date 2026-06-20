import type { ResourceListItem } from "../types";

export function resourceCategoryName(resource: ResourceListItem) {
  return resourceCategory(resource)?.name;
}

export function resourceCategory(resource: ResourceListItem) {
  return resource.category;
}

export function resourceFormatLabel(resource: ResourceListItem) {
  return resource.fileFormat || resource.dataType;
}

export function resourceProvider(resource: ResourceListItem) {
  return resource.provider;
}

export function resourceSpatialExtent(resource: ResourceListItem) {
  return resource.spatialExtent;
}

export function resourceExportId(resource: ResourceListItem) {
  return resource.id;
}
