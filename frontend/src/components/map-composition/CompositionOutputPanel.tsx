import { Alert, Button, Input, Select, Space, Tag, Typography } from "antd";
import type { CompositionIssue } from "../../map-composition/render";

interface Props {
  issues: CompositionIssue[];
  format: "png" | "jpg" | "pdf";
  note: string;
  canExport: boolean;
  exporting: boolean;
  disabled: boolean;
  onFormatChange: (format: "png" | "jpg" | "pdf") => void;
  onNoteChange: (note: string) => void;
  onGenerate: () => void;
}

export default function CompositionOutputPanel({
  issues,
  format,
  note,
  canExport,
  exporting,
  disabled,
  onFormatChange,
  onNoteChange,
  onGenerate,
}: Props) {
  return (
    <aside className="map-composition-output-pane">
      <Typography.Title level={5}>出图检查</Typography.Title>
      <div className="composition-issues">
        {issues.length === 0 ? (
          <Alert type="success" showIcon title="版式检查通过" />
        ) : (
          issues.map((issue) => (
            <Alert
              key={issue.message}
              type={issue.level}
              showIcon
              title={issue.message}
            />
          ))
        )}
      </div>
      <Typography.Title level={5}>生成专题成果</Typography.Title>
      <Space orientation="vertical" style={{ width: "100%" }}>
        <Select
          value={format}
          style={{ width: "100%" }}
          options={[
            { label: "PDF 正式打印", value: "pdf" },
            { label: "PNG 无损图片", value: "png" },
            { label: "JPG 压缩图片", value: "jpg" },
          ]}
          onChange={onFormatChange}
        />
        <Input.TextArea
          rows={3}
          value={note}
          placeholder="版本说明（可选）"
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <Tag color={canExport ? "green" : "default"}>
          {canExport ? "具备成果导出权限" : "没有成果导出权限"}
        </Tag>
        <Button
          block
          type="primary"
          disabled={!canExport || disabled}
          loading={exporting}
          onClick={onGenerate}
        >
          生成并下载 {format.toUpperCase()}
        </Button>
      </Space>
    </aside>
  );
}
