import { api } from "../api/client";
import type {
  DataResource,
  LoadedLayer,
  LoadedLayerGroup,
  LoadedRasterLayer,
  LoadedVectorLayer,
  WorkspaceSceneSnapshot,
} from "../types";
import { createVectorLayerGroup } from "../utils/layerFactory";
import type { AppNotification } from "./workspaceNotifications";
import { showGeojsonWarnings } from "./workspaceNotifications";
import { isLoadedVectorLayer } from "./workspaceSnapshot";

export interface WorkspaceRestoreProgress {
  percent: number;
  detail: string;
}

interface RestoreWorkspaceGroupsOptions {
  savedGroups: WorkspaceSceneSnapshot["groups"];
  canQueryData: boolean;
  canLoadVectorLayer: boolean;
  queryResultLimit: number;
  notification: AppNotification;
  warn: (message: string) => void;
  onProgress?: (state: WorkspaceRestoreProgress) => void;
}

export async function restoreWorkspaceGroups({
  savedGroups,
  canQueryData,
  canLoadVectorLayer,
  queryResultLimit,
  notification,
  warn,
  onProgress,
}: RestoreWorkspaceGroupsOptions): Promise<LoadedLayerGroup[]> {
  if (!Array.isArray(savedGroups)) {
    return [];
  }
  const totalLayers = savedGroups.reduce(
    (total, group) => total + (group.children?.length ?? 0),
    0,
  );
  let processedLayers = 0;
  const updateRestoreProgress = (detail: string) => {
    if (!onProgress) {
      return;
    }
    const layerProgress =
      totalLayers > 0 ? Math.round((processedLayers / totalLayers) * 70) : 70;
    onProgress({
      percent: Math.min(85, 10 + layerProgress),
      detail,
    });
  };
  const restored: LoadedLayerGroup[] = [];
  for (const savedGroup of savedGroups) {
    const restoredChildren: LoadedLayer[] = [];
    for (const savedLayer of savedGroup.children ?? []) {
      updateRestoreProgress(`正在恢复图层：${savedLayer.name}`);
      if (isLoadedVectorLayer(savedLayer)) {
        restoredChildren.push(savedLayer);
        processedLayers += 1;
        updateRestoreProgress(`已恢复图层：${savedLayer.name}`);
        continue;
      }
      if (savedLayer.layerType === "vector") {
        if (!savedLayer.query || !canQueryData || !canLoadVectorLayer) {
          processedLayers += 1;
          updateRestoreProgress(`已跳过图层：${savedLayer.name}`);
          continue;
        }
        try {
          const profile = await api.resourceProfile(savedLayer.sourceResource);
          const result = await api.queryResource(savedLayer.sourceResource, {
            attributeFilters: savedLayer.query.attributeFilters,
            spatialFilter: savedLayer.query.spatialFilter,
            limit: queryResultLimit,
          });
          showGeojsonWarnings(notification, result.warnings);
          const queryGroup = createVectorLayerGroup(
            savedLayer.sourceResource,
            profile,
            result,
            savedLayer.query,
          );
          const queryLayer = queryGroup.children[0];
          if (queryLayer?.layerType === "vector") {
            restoredChildren.push({
              ...queryLayer,
              id: savedLayer.id,
              name: savedLayer.name,
              visible: savedLayer.visible,
              summary: savedLayer.summary,
              metadata: savedLayer.metadata,
              symbolization:
                savedLayer.symbolization as LoadedVectorLayer["symbolization"],
              fields: savedLayer.fields,
            });
          }
        } catch (error) {
          warn(
            error instanceof Error
              ? `图层“${savedLayer.name}”恢复失败：${error.message}`
              : `图层“${savedLayer.name}”恢复失败`,
          );
        }
        processedLayers += 1;
        updateRestoreProgress(`已处理图层：${savedLayer.name}`);
        continue;
      }
      restoredChildren.push({
        id: savedLayer.id,
        name: savedLayer.name,
        layerType: "raster",
        sourceResource: savedLayer.sourceResource as DataResource,
        tileUrl: savedLayer.tileUrl,
        imageCoordinates: savedLayer.imageCoordinates,
        rasterDatasetId: savedLayer.rasterDatasetId,
        rasterLayerId: savedLayer.rasterLayerId,
        rasterMetadata: savedLayer.rasterMetadata,
        renderStatus: savedLayer.renderStatus,
        renderProgress: savedLayer.renderProgress,
        renderMessages: savedLayer.renderMessages,
        geometryType: savedLayer.geometryType,
        visible: savedLayer.visible,
        summary: savedLayer.summary,
        metadata: savedLayer.metadata,
        symbolization:
          savedLayer.symbolization as LoadedRasterLayer["symbolization"],
        fields: savedLayer.fields,
      });
      processedLayers += 1;
      updateRestoreProgress(`已恢复图层：${savedLayer.name}`);
    }
    if (restoredChildren.length > 0) {
      restored.push({ ...savedGroup, children: restoredChildren });
    }
  }
  return restored;
}
