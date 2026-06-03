import {
  Button,
  Descriptions,
  Empty,
  Segmented,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { Crop, Info, MousePointer2, PenTool, X } from "lucide-react";
import type { DrawMode } from "../map/spatialDraw";
import type { GeoJsonGeometry, LoadedLayer, SpatialFilter } from "../types";

type DrawPurpose = "query" | "exportClip";

interface Props {
  selectedLayer: LoadedLayer | null;
  spatialFilter: SpatialFilter | null;
  exportClipGeometry: GeoJsonGeometry | null;
  layerExtentVisible: boolean;
  activeDraw: { purpose: DrawPurpose; mode: NonNullable<DrawMode> } | null;
  onStartQueryDraw: (mode: DrawMode | null) => void;
  onStartExportClipDraw: (mode: DrawMode) => void;
  onLayerExtentVisibleChange: (visible: boolean) => void;
  onClearSpatialFilter: () => void;
  onClearExportClipGeometry: () => void;
}

export default function WorkspaceBottomPanel({
  selectedLayer,
  spatialFilter,
  exportClipGeometry,
  layerExtentVisible,
  activeDraw,
  onStartQueryDraw,
  onStartExportClipDraw,
  onLayerExtentVisibleChange,
  onClearSpatialFilter,
  onClearExportClipGeometry,
}: Props) {
  return (
    <Tabs
      className="workspace-bottom-tabs"
      size="small"
      tabPosition="bottom"
      items={[
        {
          key: "draw",
          label: (
            <span className="tab-label">
              <PenTool size={14} />
              图形绘制
            </span>
          ),
          children: (
            <DrawingPanel
              spatialFilter={spatialFilter}
              exportClipGeometry={exportClipGeometry}
              activeDraw={activeDraw}
              onStartQueryDraw={onStartQueryDraw}
              onStartExportClipDraw={onStartExportClipDraw}
              onClearSpatialFilter={onClearSpatialFilter}
              onClearExportClipGeometry={onClearExportClipGeometry}
            />
          ),
        },
        {
          key: "metadata",
          label: (
            <span className="tab-label">
              <Info size={14} />
              元数据
            </span>
          ),
          children: (
            <MetadataPanel
              layer={selectedLayer}
              layerExtentVisible={layerExtentVisible}
              onLayerExtentVisibleChange={onLayerExtentVisibleChange}
            />
          ),
        },
      ]}
    />
  );
}

function MetadataPanel({
  layer,
  layerExtentVisible,
  onLayerExtentVisibleChange,
}: {
  layer: LoadedLayer | null;
  layerExtentVisible: boolean;
  onLayerExtentVisibleChange: (visible: boolean) => void;
}) {
  if (!layer) {
    return (
      <Empty
        className="bottom-panel-empty"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请选择一个已加载图层"
      />
    );
  }

  const metadata = {
    ...layer.metadata,
    空间范围: layer.metadata.空间范围 ?? layer.sourceResource.spatialExtent,
  };
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== undefined && value !== "",
  );

  return (
    <section className="bottom-card-panel">
      <div className="bottom-card-heading">
        <Space size={8}>
          <Info size={15} />
          <Typography.Text strong>{layer.name}</Typography.Text>
          <Tag color={layer.layerType === "vector" ? "green" : "blue"}>
            {layer.layerType === "vector" ? "矢量" : "栅格"}
          </Tag>
        </Space>
        <Typography.Text type="secondary">{layer.summary}</Typography.Text>
      </div>
      {entries.length > 0 ? (
        <Descriptions size="small" column={1} bordered>
          {entries.map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {key === "空间范围" ? (
                <Space size={8} wrap>
                  <Typography.Text>{String(value ?? "-")}</Typography.Text>
                  <Switch
                    size="small"
                    checked={layerExtentVisible}
                    checkedChildren="显示"
                    unCheckedChildren="隐藏"
                    onChange={onLayerExtentVisibleChange}
                  />
                </Space>
              ) : (
                String(value ?? "-")
              )}
            </Descriptions.Item>
          ))}
        </Descriptions>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无元数据" />
      )}
    </section>
  );
}

function DrawingPanel({
  spatialFilter,
  exportClipGeometry,
  activeDraw,
  onStartQueryDraw,
  onStartExportClipDraw,
  onClearSpatialFilter,
  onClearExportClipGeometry,
}: Omit<
  Props,
  "selectedLayer" | "layerExtentVisible" | "onLayerExtentVisibleChange"
>) {
  return (
    <div className="drawing-panel-grid">
      <section className="drawing-control-block">
        <div className="drawing-control-title">
          <MousePointer2 size={15} />
          <Typography.Text strong>空间查询范围</Typography.Text>
          {spatialFilter && (
            <Tag color="green">已绘制{spatialModeName(spatialFilter.mode)}</Tag>
          )}
        </div>
        <Segmented
          block
          value={activeDraw?.purpose === "query" ? activeDraw.mode : "none"}
          options={[
            { label: "无", value: "none" },
            { label: "矩形", value: "rectangle" },
            { label: "圆", value: "circle" },
            { label: "椭圆", value: "ellipse" },
            { label: "多边形", value: "polygon" },
          ]}
          onChange={(nextValue) =>
            onStartQueryDraw(
              nextValue === "none" ? null : (nextValue as DrawMode),
            )
          }
        />
        <Button
          size="small"
          icon={<X size={13} />}
          disabled={!spatialFilter}
          onClick={onClearSpatialFilter}
        >
          清除查询范围
        </Button>
      </section>

      <section className="drawing-control-block">
        <div className="drawing-control-title">
          <Crop size={15} />
          <Typography.Text strong>导出裁切范围</Typography.Text>
          {exportClipGeometry && <Tag color="blue">已绘制</Tag>}
        </div>
        <Segmented
          block
          value={
            activeDraw?.purpose === "exportClip" ? activeDraw.mode : "none"
          }
          options={[
            { label: "无", value: "none" },
            { label: "矩形", value: "rectangle" },
            { label: "圆", value: "circle" },
            { label: "多边形", value: "polygon" },
          ]}
          onChange={(nextValue) => {
            if (nextValue !== "none") {
              onStartExportClipDraw(nextValue as DrawMode);
            }
          }}
        />
        <Button
          size="small"
          icon={<X size={13} />}
          disabled={!exportClipGeometry}
          onClick={onClearExportClipGeometry}
        >
          清除裁切范围
        </Button>
      </section>
    </div>
  );
}

function spatialModeName(mode: SpatialFilter["mode"]) {
  const names = {
    rectangle: "矩形",
    circle: "圆",
    ellipse: "椭圆",
    polygon: "多边形",
  };
  return names[mode];
}
