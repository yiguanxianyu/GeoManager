import { App } from "antd";
import type { Map as MapboxMap } from "mapbox-gl";
import type { RefObject } from "react";
import { useCallback, useState } from "react";
import { api } from "../api/client";
import type {
  LoadedLayerGroup,
  MapViewState,
  WorkspaceScene,
  WorkspaceSceneKind,
  WorkspaceSceneSnapshot,
} from "../types";
import {
  openWorkspaceProgressNotification,
  showWorkspaceRestoreEmptyResult,
  showWorkspaceRestoreIssues,
} from "../workspace/workspaceNotifications";
import { restoreWorkspaceGroups } from "../workspace/workspaceRestore";
import { workspaceSnapshot } from "../workspace/workspaceSnapshot";

interface UseWorkspaceScenesOptions {
  canBrowseData: boolean;
  canQueryData: boolean;
  canLoadVectorLayer: boolean;
  queryResultLimit: number;
  groups: LoadedLayerGroup[];
  selectedLayerId: string | null;
  currentMapView: MapViewState | null;
  mapRef: RefObject<MapboxMap | null>;
  replaceGroups: (groups: LoadedLayerGroup[]) => void;
  setSelectedLayerId: (layerId: string | null) => void;
  onWorkspaceLoaded: () => void;
}

export function useWorkspaceScenes({
  canBrowseData,
  canQueryData,
  canLoadVectorLayer,
  queryResultLimit,
  groups,
  selectedLayerId,
  currentMapView,
  mapRef,
  replaceGroups,
  setSelectedLayerId,
  onWorkspaceLoaded,
}: UseWorkspaceScenesOptions) {
  const { message, notification } = App.useApp();
  const [workspaceScenes, setWorkspaceScenes] = useState<WorkspaceScene[]>([]);

  const loadWorkspaceScenes = useCallback(async () => {
    if (!canBrowseData) {
      return [];
    }
    try {
      const sceneResponse = await api.workspaces();
      setWorkspaceScenes(sceneResponse.items);
      return sceneResponse.items;
    } catch (error) {
      message.warning(
        error instanceof Error ? error.message : "搜索内容加载失败",
      );
      return [];
    }
  }, [canBrowseData, message]);

  const saveWorkspace = useCallback(
    async (
      kind: WorkspaceSceneKind,
      values: { name: string; description?: string; targetId?: number },
    ) => {
      const label = kind === "project" ? "工程" : "专题";
      const notificationKey = `workspace-save-${kind}-${Date.now()}`;
      const targetName = values.name.trim();
      try {
        openWorkspaceProgressNotification(notification, {
          key: notificationKey,
          title: values.targetId ? `正在覆盖${label}` : `正在保存${label}`,
          percent: 15,
          status: "active",
          detail: "正在整理当前图层、视图和符号化配置",
        });
        const snapshot = workspaceSnapshot(
          groups,
          selectedLayerId,
          currentMapView,
        );
        openWorkspaceProgressNotification(notification, {
          key: notificationKey,
          title: values.targetId ? `正在覆盖${label}` : `正在保存${label}`,
          percent: 55,
          status: "active",
          detail: "正在写入工作区快照",
        });
        const saved = values.targetId
          ? await api.updateWorkspace(values.targetId, {
              kind,
              name: targetName,
              description: values.description?.trim() ?? "",
              snapshot,
            })
          : await api.createWorkspace({
              kind,
              name: targetName,
              description: values.description?.trim() ?? "",
              snapshot,
            });
        if ("id" in saved) {
          setWorkspaceScenes((current) => {
            const others = current.filter((item) => item.id !== saved.id);
            return [saved, ...others];
          });
        }
        openWorkspaceProgressNotification(notification, {
          key: notificationKey,
          title: values.targetId ? `${label}已覆盖` : `${label}已保存`,
          percent: 100,
          status: "success",
          detail: targetName,
        });
      } catch (error) {
        openWorkspaceProgressNotification(notification, {
          key: notificationKey,
          title: `${label}保存失败`,
          percent: 100,
          status: "exception",
          detail: error instanceof Error ? error.message : `${label}保存失败`,
        });
        throw error;
      }
    },
    [currentMapView, groups, notification, selectedLayerId],
  );

  const loadWorkspaceScene = useCallback(
    async (scene: WorkspaceScene) => {
      const label = scene.kind === "project" ? "工程" : "专题";
      const notificationKey = `workspace-load-${scene.id}`;
      const snapshot = scene.snapshot as WorkspaceSceneSnapshot;
      if (!Array.isArray(snapshot.groups)) {
        message.warning("该工作区快照不包含可恢复的图层");
        return;
      }
      openWorkspaceProgressNotification(notification, {
        key: notificationKey,
        title: `正在加载${label}`,
        percent: 8,
        status: "active",
        detail: scene.name,
      });
      const restoreResult = await restoreWorkspaceGroups({
        savedGroups: snapshot.groups,
        canQueryData,
        canLoadVectorLayer,
        queryResultLimit,
        notification,
        onProgress: (state) => {
          openWorkspaceProgressNotification(notification, {
            key: notificationKey,
            title: `正在加载${label}`,
            percent: state.percent,
            status: "active",
            detail: state.detail,
          });
        },
      });
      const restoredGroups = restoreResult.groups;
      if (restoredGroups.length === 0) {
        showWorkspaceRestoreEmptyResult(notification, {
          key: notificationKey,
          label,
          issues: restoreResult.issues,
        });
        if (restoreResult.issues.length === 0) {
          message.warning("该工作区快照没有可恢复的图层");
        }
        return;
      }
      openWorkspaceProgressNotification(notification, {
        key: notificationKey,
        title: `正在加载${label}`,
        percent: 90,
        status: "active",
        detail: "正在应用图层和地图视图",
      });
      replaceGroups(restoredGroups);
      setSelectedLayerId(snapshot.selectedLayerId ?? null);
      onWorkspaceLoaded();
      if (snapshot.mapView && mapRef.current) {
        mapRef.current.flyTo({
          center: snapshot.mapView.center,
          zoom: snapshot.mapView.zoom,
          bearing: snapshot.mapView.bearing,
          pitch: snapshot.mapView.pitch,
          duration: 800,
          essential: true,
        });
      }
      openWorkspaceProgressNotification(notification, {
        key: notificationKey,
        title: `${label}已加载`,
        percent: 100,
        status: "success",
        detail: scene.name,
      });
      showWorkspaceRestoreIssues(notification, restoreResult.issues);
    },
    [
      mapRef,
      message,
      notification,
      onWorkspaceLoaded,
      replaceGroups,
      canLoadVectorLayer,
      canQueryData,
      queryResultLimit,
      setSelectedLayerId,
    ],
  );

  const loadWorkspaceSceneById = useCallback(
    async (sceneId: number) => {
      const scene =
        workspaceScenes.find((item) => item.id === sceneId) ??
        (await api.workspace(sceneId));
      await loadWorkspaceScene(scene);
    },
    [loadWorkspaceScene, workspaceScenes],
  );

  const updateWorkspaceScene = useCallback((scene: WorkspaceScene) => {
    setWorkspaceScenes((current) =>
      current.map((item) => (item.id === scene.id ? scene : item)),
    );
  }, []);

  const deleteWorkspaceScene = useCallback((id: number) => {
    setWorkspaceScenes((current) => current.filter((item) => item.id !== id));
  }, []);

  return {
    workspaceScenes,
    loadWorkspaceScenes,
    saveWorkspace,
    loadWorkspaceScene,
    loadWorkspaceSceneById,
    updateWorkspaceScene,
    deleteWorkspaceScene,
  };
}
