import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  RollbackOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Popconfirm, Space, Tag, Tooltip } from "antd";
import type { MapComposition } from "../../types";

interface Props {
  composition: MapComposition;
  onPreview: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onRestore: () => void;
  onLoadSource: () => void;
  onArchive: () => void;
}

export default function MapCompositionCard({
  composition,
  onPreview,
  onOpen,
  onDownload,
  onPublish,
  onUnpublish,
  onRestore,
  onLoadSource,
  onArchive,
}: Props) {
  const previewVersion = composition.currentVersion;
  return (
    <article className="map-composition-card">
      <button
        className="map-composition-thumbnail"
        type="button"
        disabled={!composition.canPreview || !previewVersion}
        onClick={onPreview}
      >
        {previewVersion ? (
          <>
            <EyeOutlined />
            <span>预览 V{previewVersion.versionNumber}</span>
          </>
        ) : (
          <span>尚未生成成果</span>
        )}
      </button>
      <div className="map-composition-card-main">
        <div className="map-composition-card-title">
          <strong>{composition.name}</strong>
          <Tag color={statusColor(composition.status)}>
            {statusLabel(composition.status)}
          </Tag>
          {!composition.isOwner ? <Tag color="cyan">非本人专题</Tag> : null}
        </div>
        <small>来源：{composition.projectName}</small>
        <small>
          所属：{composition.owner.displayName || composition.owner.username}
        </small>
        {composition.publishedVersion ? (
          <small>
            已发布 V{composition.publishedVersion.versionNumber} ·{" "}
            {composition.audienceGroups.map((group) => group.name).join("、") ||
              "未配置角色"}
          </small>
        ) : (
          <small>
            {composition.description ||
              new Date(composition.updatedAt).toLocaleString("zh-CN", {
                hour12: false,
              })}
          </small>
        )}
      </div>
      <Space size={4} wrap>
        {composition.canEditLayout ? (
          <Button size="small" icon={<EditOutlined />} onClick={onOpen}>
            编辑版式
          </Button>
        ) : null}
        <Button
          size="small"
          icon={<DownloadOutlined />}
          disabled={!composition.canDownload || !previewVersion}
          onClick={onDownload}
        >
          下载
        </Button>
        {composition.canPublish ? (
          <Button size="small" icon={<UploadOutlined />} onClick={onPublish}>
            {composition.status === "published" ? "更新发布" : "发布"}
          </Button>
        ) : null}
        {composition.canUnpublish ? (
          <Button size="small" onClick={onUnpublish}>
            下架
          </Button>
        ) : null}
        {composition.canRestoreProject ? (
          <Button size="small" icon={<RollbackOutlined />} onClick={onRestore}>
            还原工程
          </Button>
        ) : null}
        {composition.canLoadSourceProject ? (
          <Button
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={onLoadSource}
          >
            来源工程
          </Button>
        ) : null}
        {composition.canArchive ? (
          <Popconfirm
            title="归档出图稿"
            description={`确认归档“${composition.name}”？成果文件将保留用于审计。`}
            okText="归档"
            cancelText="取消"
            onConfirm={onArchive}
          >
            <Tooltip title="归档">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        ) : null}
      </Space>
    </article>
  );
}

function statusLabel(status: MapComposition["status"]) {
  return { draft: "草稿", completed: "未发布", published: "已发布" }[status];
}

function statusColor(status: MapComposition["status"]) {
  return { draft: "default", completed: "blue", published: "green" }[status];
}
