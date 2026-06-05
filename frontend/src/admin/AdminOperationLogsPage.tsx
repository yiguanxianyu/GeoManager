import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import { App, Button, Space, Tag } from "antd";
import { useRef } from "react";
import { downloadTextFile } from "../utils/download";
import {
  filterOperationLogs,
  type OperationLog,
  type OperationLogQuery,
  operationLogsToCsv,
} from "./data";

const resultText: Record<OperationLog["result"], string> = {
  success: "成功",
  warning: "告警",
  failed: "失败",
};

const resultColor: Record<OperationLog["result"], string> = {
  success: "success",
  warning: "warning",
  failed: "error",
};

const columns: ProColumns<OperationLog>[] = [
  {
    title: "操作时间",
    dataIndex: "occurredAt",
    valueType: "dateTimeRange",
    width: 190,
    sorter: (a, b) => a.occurredAt.localeCompare(b.occurredAt),
    render: (_, record) => record.occurredAt,
  },
  {
    title: "操作用户",
    dataIndex: "operator",
    width: 140,
    ellipsis: true,
  },
  {
    title: "模块",
    dataIndex: "module",
    width: 130,
    valueType: "select",
    valueEnum: {
      操作日志: { text: "操作日志" },
      系统设置: { text: "系统设置" },
      认证授权: { text: "认证授权" },
    },
  },
  {
    title: "动作",
    dataIndex: "action",
    width: 150,
    ellipsis: true,
  },
  {
    title: "结果",
    dataIndex: "result",
    width: 110,
    valueType: "select",
    valueEnum: {
      success: { text: "成功", status: "Success" },
      warning: { text: "告警", status: "Warning" },
      failed: { text: "失败", status: "Error" },
    },
    render: (_, record) => (
      <Tag color={resultColor[record.result]}>{resultText[record.result]}</Tag>
    ),
  },
  {
    title: "IP 地址",
    dataIndex: "ipAddress",
    width: 140,
    search: false,
  },
  {
    title: "关键词",
    dataIndex: "keyword",
    hideInTable: true,
  },
  {
    title: "摘要",
    dataIndex: "summary",
    width: 360,
    search: false,
    ellipsis: true,
  },
];

export default function AdminOperationLogsPage() {
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const { message } = App.useApp();

  function exportLogs() {
    const query = (formRef.current?.getFieldsValue() ??
      {}) as OperationLogQuery;
    const rows = filterOperationLogs(query);
    downloadTextFile(operationLogsToCsv(rows), "operation-logs.csv");
    message.success("已生成操作日志导出文件");
  }

  return (
    <ProTable<OperationLog, OperationLogQuery>
      className="admin-table"
      actionRef={actionRef}
      formRef={formRef}
      rowKey="id"
      columns={columns}
      cardBordered
      options={false}
      search={{
        labelWidth: 92,
        span: { xs: 24, sm: 12, md: 8, lg: 8, xl: 6, xxl: 6 },
      }}
      pagination={{
        pageSize: 5,
        showSizeChanger: false,
      }}
      scroll={{ x: 1200 }}
      request={async (params) => {
        const data = filterOperationLogs(params);
        return {
          data,
          total: data.length,
          success: true,
        };
      }}
      headerTitle="日志列表"
      toolBarRender={() => [
        <Button
          key="reload"
          icon={<ReloadOutlined />}
          onClick={() => actionRef.current?.reload()}
        >
          刷新
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportLogs}
        >
          导出日志
        </Button>,
      ]}
      tableAlertRender={({ selectedRowKeys }) => (
        <Space size={12}>
          已选择 <strong>{selectedRowKeys.length}</strong> 条日志
        </Space>
      )}
      rowSelection={{}}
    />
  );
}
