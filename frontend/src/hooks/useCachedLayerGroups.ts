import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { LoadedLayerGroup } from "../types";
import {
  readCachedLayerGroups,
  writeCachedLayerGroups,
} from "../utils/layerWorkspaceStorage";

export function useCachedLayerGroups(
  cacheKey: string,
): [LoadedLayerGroup[], Dispatch<SetStateAction<LoadedLayerGroup[]>>] {
  const [groups, setGroupsState] = useState<LoadedLayerGroup[]>([]);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const storageHydratedRef = useRef(false);
  const localChangeBeforeHydrationRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    storageHydratedRef.current = false;
    localChangeBeforeHydrationRef.current = false;
    setStorageHydrated(false);
    setGroupsState([]);

    async function hydrateCachedGroups() {
      try {
        const cachedGroups = await readCachedLayerGroups(cacheKey);
        if (cancelled) return;
        if (!localChangeBeforeHydrationRef.current) {
          setGroupsState(cachedGroups);
        }
      } catch (error) {
        console.warn("读取本地图层缓存失败", error);
      } finally {
        if (!cancelled) {
          storageHydratedRef.current = true;
          setStorageHydrated(true);
        }
      }
    }

    void hydrateCachedGroups();
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  useEffect(() => {
    if (!storageHydrated) return;
    void writeCachedLayerGroups(cacheKey, groups).catch((error) => {
      console.warn("写入本地图层缓存失败", error);
    });
  }, [cacheKey, groups, storageHydrated]);

  const setGroups: Dispatch<SetStateAction<LoadedLayerGroup[]>> = useCallback(
    (value) => {
      if (!storageHydratedRef.current) {
        localChangeBeforeHydrationRef.current = true;
      }
      setGroupsState(value);
    },
    [],
  );

  return [groups, setGroups];
}
