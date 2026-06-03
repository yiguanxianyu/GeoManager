import type { TableColumnsType, TableProps } from "antd";
import {
  Button,
  Checkbox,
  Descriptions,
  Dropdown,
  Empty,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { Database, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import type { LoadedLayer, LoadedVectorLayer } from "../types";

interface Props {
  layer: LoadedLayer | null;
  open: boolean;
  onClose: () => void;
}

export default function LayerDataTableModal({ layer, open, onClose }: Props) {
  return (
    <Modal
      title={layer ? `${layer.name} 数据表` : "数据表"}
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(1100px, calc(100vw - 48px))"
      styles={{ body: { padding: 0 } }}
      destroyOnHidden
    >
      {!layer ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请选择图层"
          style={{ padding: 24 }}
        />
      ) : layer.layerType === "vector" ? (
        <VectorAttributeTable layer={layer} />
      ) : (
        <Descriptions
          size="small"
          column={2}
          bordered
          style={{ padding: 16 }}
        >
          <Descriptions.Item label="图层">{layer.name}</Descriptions.Item>
          <Descriptions.Item label="类型">栅格</Descriptions.Item>
          <Descriptions.Item label="波段数">
            {layer.rasterMetadata?.bands.length ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {layer.renderStatus || "默认"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}

type RowData = Record<string, unknown> & { __rowKey: string };

function VectorAttributeTable({ layer }: { layer: LoadedVectorLayer }) {
  const fieldNames = layer.fields.length
    ? layer.fields.map((field) => field.name)
    : inferPropertyNames(layer);
  const rows = useMemo(() => buildTableRows(layer, fieldNames), [layer, fieldNames]);

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const toggleHidden = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleFieldNames = fieldNames.filter((n) => !hiddenKeys.has(n));

  const columns: TableColumnsType<RowData> = useMemo(() => {
    const indexCol: TableColumnsType<RowData>[number] = {
      title: "#",
      key: "__index",
      width: 56,
      fixed: "left",
      render: (_, __, index) => index + 1,
    };

    const dataCols: TableColumnsType<RowData> = visibleFieldNames.map(
      (fieldName) => ({
        title: fieldName,
        dataIndex: fieldName,
        key: fieldName,
        ellipsis: true,
        sorter: (a, b) => {
          const va = String(a[fieldName] ?? "");
          const vb = String(b[fieldName] ?? "");
          return va.localeCompare(vb, "zh-CN", { numeric: true });
        },
        filters: buildColumnFilters(rows, fieldName),
        onFilter: (value, record) =>
          String(record[fieldName] ?? "").includes(String(value)),
        filterSearch: true,
        render: (value: unknown) => String(value ?? "-"),
      }),
    );

    return [indexCol, ...dataCols];
  }, [visibleFieldNames, rows]);

  const rowSelection: TableProps<RowData>["rowSelection"] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div className="layer-table-modal-content">
      <div className="bottom-table-heading">
        <Space size={8}>
          <Database size={15} />
          <Typography.Text strong>{layer.name}</Typography.Text>
          <Tag color="green">{rows.length} 条</Tag>
          {hasSelected && <Tag color="blue">已选 {selectedRowKeys.length} 条</Tag>}
        </Space>
        <Space size={8}>
          <Dropdown
            menu={{
              items: fieldNames.map((name) => ({
                key: name,
                label: (
                  <Checkbox
                    checked={!hiddenKeys.has(name)}
                    onChange={() => toggleHidden(name)}
                  >
                    {name}
                  </Checkbox>
                ),
              })),
            }}
            trigger={["click"]}
          >
            <Button size="small" icon={<EyeOff size={14} />}>
              列显隐
            </Button>
          </Dropdown>
          <Typography.Text type="secondary">{layer.summary}</Typography.Text>
        </Space>
      </div>
      <Table<RowData>
        size="small"
        rowKey="__rowKey"
        dataSource={rows}
        columns={columns}
        rowSelection={rowSelection}
        pagination={{ pageSize: 20, showSizeChanger: true, size: "small" }}
        scroll={{ x: "max-content", y: 420 }}
        showSorterTooltip={{ target: "sorter-icon" }}
      />
    </div>
  );
}

function buildColumnFilters(
  rows: RowData[],
  fieldName: string,
): { text: string; value: string }[] {
  const unique = new Set<string>();
  for (const row of rows) {
    const val = String(row[fieldName] ?? "");
    if (val) unique.add(val);
  }
  const values = Array.from(unique).slice(0, 50);
  return values.map((v) => ({ text: v, value: v }));
}

function inferPropertyNames(layer: LoadedVectorLayer) {
  const names = new Set<string>();
  for (const feature of layer.geojson.features) {
    const properties = (feature as { properties?: Record<string, unknown> })
      .properties;
    for (const name of Object.keys(properties ?? {})) {
      names.add(name);
    }
  }
  return Array.from(names);
}

function buildTableRows(layer: LoadedVectorLayer, fieldNames: string[]) {
  const keyCounts = new Map<string, number>();
  return layer.geojson.features.map((feature) => {
    const properties =
      (feature as { properties?: Record<string, unknown> }).properties ?? {};
    const baseKey = stableFeatureKey(feature);
    const count = keyCounts.get(baseKey) ?? 0;
    keyCounts.set(baseKey, count + 1);
    return {
      __rowKey: count ? `${baseKey}-${count}` : baseKey,
      ...Object.fromEntries(
        fieldNames.map((fieldName) => [fieldName, properties[fieldName]]),
      ),
    };
  });
}

function stableFeatureKey(feature: Record<string, unknown>) {
  const featureId = feature.id;
  if (typeof featureId === "string" || typeof featureId === "number") {
    return `feature-${featureId}`;
  }
  const text = JSON.stringify({
    properties: feature.properties ?? {},
    geometry: feature.geometry ?? {},
  });
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return `feature-${hash.toString(16)}`;
}
