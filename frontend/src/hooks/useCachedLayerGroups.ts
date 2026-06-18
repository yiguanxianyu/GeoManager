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

const cacheWriteDelayMs = 600;
const maxLayerCacheBytes = 8 * 1024 * 1024;

export function useCachedLayerGroups(
  cacheKey: string,
): [LoadedLayerGroup[], Dispatch<SetStateAction<LoadedLayerGroup[]>>] {
  const [groups, setGroupsState] = useState<LoadedLayerGroup[]>([]);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const storageHydratedRef = useRef(false);
  const localChangeBeforeHydrationRef = useRef(false);
  const cacheWriteTimerRef = useRef<number | null>(null);
  const lastSerializedGroupsRef = useRef("");
  const latestCacheKeyRef = useRef(cacheKey);
  const latestGroupsRef = useRef(groups);
  const writeInFlightRef = useRef(false);
  const pendingWriteRef = useRef<{
    cacheKey: string;
    groups: LoadedLayerGroup[];
    serialized: string;
  } | null>(null);

  const drainWriteQueue = useCallback(() => {
    if (writeInFlightRef.current) return;
    const next = pendingWriteRef.current;
    if (!next) return;
    pendingWriteRef.current = null;
    writeInFlightRef.current = true;
    void writeCachedLayerGroups(next.cacheKey, next.groups)
      .then(() => {
        lastSerializedGroupsRef.current = next.serialized;
      })
      .catch((error) => {
        console.warn("写入本地图层缓存失败", error);
      })
      .finally(() => {
        writeInFlightRef.current = false;
        drainWriteQueue();
      });
  }, []);

  const persistLatestGroups = useCallback(() => {
    if (!storageHydratedRef.current) return;
    const serialized = JSON.stringify(latestGroupsRef.current);
    if (serialized === lastSerializedGroupsRef.current) {
      return;
    }
    const serializedBytes = new TextEncoder().encode(serialized).byteLength;
    if (serializedBytes > maxLayerCacheBytes) {
      console.warn(
        `本地图层缓存超过 ${Math.round(maxLayerCacheBytes / 1024 / 1024)}MB，已跳过写入`,
      );
      return;
    }
    pendingWriteRef.current = {
      cacheKey: latestCacheKeyRef.current,
      groups: latestGroupsRef.current,
      serialized,
    };
    drainWriteQueue();
  }, [drainWriteQueue]);

  useEffect(() => {
    latestCacheKeyRef.current = cacheKey;
    latestGroupsRef.current = groups;
  }, [cacheKey, groups]);

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
          lastSerializedGroupsRef.current = JSON.stringify(cachedGroups);
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
    if (cacheWriteTimerRef.current !== null) {
      window.clearTimeout(cacheWriteTimerRef.current);
    }
    cacheWriteTimerRef.current = window.setTimeout(() => {
      cacheWriteTimerRef.current = null;
      persistLatestGroups();
    }, cacheWriteDelayMs);
    return () => {
      if (cacheWriteTimerRef.current !== null) {
        window.clearTimeout(cacheWriteTimerRef.current);
        cacheWriteTimerRef.current = null;
      }
    };
  }, [groups, persistLatestGroups, storageHydrated]);

  useEffect(() => {
    const flushPendingCache = () => {
      if (cacheWriteTimerRef.current !== null) {
        window.clearTimeout(cacheWriteTimerRef.current);
        cacheWriteTimerRef.current = null;
      }
      persistLatestGroups();
    };
    window.addEventListener("pagehide", flushPendingCache);
    return () => {
      window.removeEventListener("pagehide", flushPendingCache);
      flushPendingCache();
    };
  }, [persistLatestGroups]);

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
