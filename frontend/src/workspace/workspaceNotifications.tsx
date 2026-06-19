import { App, Space, Spin, Typography } from "antd";
import type { GeoJsonValidationWarning } from "../types";

export type AppNotification = ReturnType<typeof App.useApp>["notification"];

export function openWorkspaceProgressNotification(
  notification: AppNotification,
  options: {
    key: string;
    title: string;
    percent: number;
    status: "active" | "success" | "exception";
    detail: string;
  },
) {
  notification.open({
    key: options.key,
    message: options.title,
    description: (
      <Space orientation="vertical" size={6} style={{ width: "100%" }}>
        <Space size={8}>
          <Spin spinning={options.status === "active"} size="small" />
          <Typography.Text type="secondary">{options.detail}</Typography.Text>
        </Space>
      </Space>
    ),
    duration: options.status === "active" ? 0 : 5,
    showProgress: options.status !== "active",
    pauseOnHover: false,
  });
}

export function showGeojsonWarnings(
  notification: AppNotification,
  warnings?: GeoJsonValidationWarning[],
) {
  if (!warnings?.length) {
    return;
  }
  notification.warning({
    message: "地理坐标数据警告",
    description: (
      <div className="geojson-warning-list">
        {warnings.map((warning) => (
          <div key={`${warning.code}-${warning.message}`}>
            {warning.message}
          </div>
        ))}
      </div>
    ),
    placement: "topRight",
    duration: 8,
  });
}
