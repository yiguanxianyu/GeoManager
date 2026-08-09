import tiandituMapWorldLogo from "../assets/tianditu-map-world.svg";
import type { BasemapProvider } from "../map/basemapCatalog";

interface Props {
  provider: BasemapProvider;
}

export default function TiandituAttributionBadge({ provider }: Props) {
  if (provider !== "tianditu") return null;

  return (
    <aside className="tianditu-attribution-badge" aria-label="天地图底图来源">
      <a
        href="https://www.tianditu.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="访问天地图官网（新窗口打开）"
      >
        <img
          src={tiandituMapWorldLogo}
          alt="天地图 MAP WORLD"
          width={112}
          height={60}
          draggable={false}
        />
        <span>天地图底图服务</span>
      </a>
    </aside>
  );
}
