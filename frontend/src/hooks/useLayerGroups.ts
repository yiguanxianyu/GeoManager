import { useCallback } from "react";
import type {
  LoadedLayer,
  LoadedLayerGroup,
  LoadedRasterLayer,
} from "../types";
import { reorderLayerGroups } from "../utils/geometry";
import { useCachedLayerGroups } from "./useCachedLayerGroups";

export function useLayerGroups(cacheKey = "default") {
  const [groups, setGroups] = useCachedLayerGroups(cacheKey);

  const updateLayer = useCallback(
    (
      groupId: string,
      layerId: string,
      updater: (layer: LoadedLayer) => LoadedLayer,
    ) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                children: group.children.map((layer) =>
                  layer.id === layerId ? updater(layer) : layer,
                ),
              }
            : group,
        ),
      );
    },
    [setGroups],
  );

  const updateRasterLayer = useCallback(
    (
      groupId: string,
      layerId: string,
      updater: (layer: LoadedRasterLayer) => LoadedRasterLayer,
    ) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                children: group.children.map((layer) =>
                  layer.id === layerId && layer.layerType === "raster"
                    ? updater(layer)
                    : layer,
                ),
              }
            : group,
        ),
      );
    },
    [setGroups],
  );

  const setGroupVisibility = useCallback(
    (groupId: string, visible: boolean) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId ? { ...group, visible } : group,
        ),
      );
    },
    [setGroups],
  );

  const setGroupName = useCallback(
    (groupId: string, name: string) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId ? { ...group, name } : group,
        ),
      );
    },
    [setGroups],
  );

  const setGroupSymbolization = useCallback(
    (groupId: string, symbolization: LoadedLayerGroup["symbolization"]) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId ? { ...group, symbolization } : group,
        ),
      );
    },
    [setGroups],
  );

  const setLayerVisibility = useCallback(
    (groupId: string, layerId: string, visible: boolean) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                children: group.children.map((layer) =>
                  layer.id === layerId ? { ...layer, visible } : layer,
                ),
              }
            : group,
        ),
      );
    },
    [setGroups],
  );

  const setLayerName = useCallback(
    (groupId: string, layerId: string, name: string) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                children: group.children.map((layer) =>
                  layer.id === layerId ? { ...layer, name } : layer,
                ),
              }
            : group,
        ),
      );
    },
    [setGroups],
  );

  const setLayerSymbolization = useCallback(
    (
      groupId: string,
      layerId: string,
      symbolization: LoadedLayer["symbolization"],
    ) => {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                children: group.children.map((layer) =>
                  layer.id === layerId
                    ? ({ ...layer, symbolization } as LoadedLayer)
                    : layer,
                ),
              }
            : group,
        ),
      );
    },
    [setGroups],
  );

  const removeGroup = useCallback(
    (groupId: string) => {
      setGroups((current) => current.filter((group) => group.id !== groupId));
    },
    [setGroups],
  );

  const removeLayer = useCallback(
    (groupId: string, layerId: string) => {
      setGroups((current) =>
        current
          .map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  children: group.children.filter(
                    (layer) => layer.id !== layerId,
                  ),
                }
              : group,
          )
          .filter((group) => group.children.length > 0),
      );
    },
    [setGroups],
  );

  const reorderGroups = useCallback(
    (
      sourceGroupId: string,
      targetGroupId: string,
      placement: "before" | "after",
    ) => {
      setGroups((current) =>
        reorderLayerGroups(current, sourceGroupId, targetGroupId, placement),
      );
    },
    [setGroups],
  );

  const addGroup = useCallback(
    (group: LoadedLayerGroup) => {
      setGroups((current) => [group, ...current]);
    },
    [setGroups],
  );

  return {
    groups,
    setGroups,
    addGroup,
    updateLayer,
    updateRasterLayer,
    setGroupVisibility,
    setGroupName,
    setGroupSymbolization,
    setLayerVisibility,
    setLayerName,
    setLayerSymbolization,
    removeGroup,
    removeLayer,
    reorderGroups,
  };
}
