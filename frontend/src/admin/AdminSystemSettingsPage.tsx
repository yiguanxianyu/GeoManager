import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import {
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from "@ant-design/pro-components";
import { App, Button, Drawer, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { type SystemParameter, systemParameters } from "./data";

interface BasicSettingValues {
  systemName: string;
  deploymentMode: "development" | "production";
  allowRegistration: boolean;
  defaultBasemap: "osm" | "satellite";
  uploadMaxMb: number;
  queryResultLimit: number;
  description?: string;
}

export default function AdminSystemSettingsPage() {
  const { bootstrap } = useAppContext();
  const { message } = App.useApp();
  const [selectedParameter, setSelectedParameter] =
    useState<SystemParameter | null>(null);

  const parameterColumns: ProColumns<SystemParameter>[] = [
    {
      title: "参数名称",
      dataIndex: "name",
      width: 160,
      fixed: "left",
      render: (_, record) => (
        <Typography.Text strong>{record.name}</Typography.Text>
      ),
    },
    {
      title: "参数键",
      dataIndex: "key",
      width: 240,
      render: (_, record) => (
        <Typography.Text code copyable>
          {record.key}
        </Typography.Text>
      ),
    },
    {
      title: "当前值",
      dataIndex: "value",
      width: 180,
      ellipsis: true,
    },
    {
      title: "分类",
      dataIndex: "category",
      width: 130,
      filters: true,
      onFilter: true,
      valueEnum: {
        基础配置: { text: "基础配置" },
        参数管理: { text: "参数管理" },
      },
    },
    {
      title: "作用域",
      dataIndex: "scope",
      width: 130,
    },
    {
      title: "重启",
      dataIndex: "restartRequired",
      width: 100,
      render: (_, record) =>
        record.restartRequired ? (
          <Tag color="orange">需要</Tag>
        ) : (
          <Tag color="green">即时</Tag>
        ),
    },
    {
      title: "说明",
      dataIndex: "description",
      width: 360,
      ellipsis: true,
    },
    {
      title: "操作",
      valueType: "option",
      width: 100,
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => setSelectedParameter(record)}
        >
          编辑
        </Button>,
      ],
    },
  ];

  return (
    <div className="admin-page-stack">
      <ProCard title="基础配置" className="admin-section-card">
        <ProForm<BasicSettingValues>
          layout="horizontal"
          grid
          initialValues={{
            systemName: bootstrap.systemName,
            deploymentMode: "production",
            allowRegistration: bootstrap.allowRegistration,
            defaultBasemap:
              bootstrap.map.defaultBasemap === "satellite"
                ? "satellite"
                : "osm",
            uploadMaxMb: 512,
            queryResultLimit: 30000,
            description:
              "配置项保存后将进入待发布状态，当前页面仅提供静态前端交互。",
          }}
          onFinish={async () => {
            message.success("基础配置已保存到静态草稿");
            return true;
          }}
          submitter={{
            searchConfig: {
              submitText: "保存配置",
              resetText: "重置",
            },
            submitButtonProps: {
              icon: <SaveOutlined />,
            },
          }}
        >
          <ProFormText
            name="systemName"
            label="系统名称"
            colProps={{ xs: 24, md: 12 }}
            rules={[{ required: true, message: "请输入系统名称" }]}
          />
          <ProFormSelect
            name="deploymentMode"
            label="运行模式"
            colProps={{ xs: 24, md: 12 }}
            options={[
              { label: "生产", value: "production" },
              { label: "开发", value: "development" },
            ]}
          />
          <ProFormSwitch
            name="allowRegistration"
            label="开放注册"
            colProps={{ xs: 24, md: 12 }}
          />
          <ProFormSelect
            name="defaultBasemap"
            label="默认底图"
            colProps={{ xs: 24, md: 12 }}
            options={[
              { label: "OpenStreetMap", value: "osm" },
              { label: "卫星影像", value: "satellite" },
            ]}
          />
          <ProFormDigit
            name="uploadMaxMb"
            label="上传上限 MB"
            colProps={{ xs: 24, md: 12 }}
            min={1}
            max={2048}
          />
          <ProFormDigit
            name="queryResultLimit"
            label="查询结果上限"
            colProps={{ xs: 24, md: 12 }}
            min={100}
            max={30000}
          />
          <ProFormTextArea
            name="description"
            label="变更说明"
            colProps={{ xs: 24 }}
            fieldProps={{ rows: 3 }}
          />
        </ProForm>
      </ProCard>

      <ProTable<SystemParameter>
        className="admin-table"
        rowKey="id"
        headerTitle="参数管理"
        columns={parameterColumns}
        dataSource={systemParameters}
        search={false}
        options={false}
        cardBordered
        pagination={false}
        scroll={{ x: 1300 }}
      />

      <Drawer
        title="编辑参数"
        open={Boolean(selectedParameter)}
        onClose={() => setSelectedParameter(null)}
        size="large"
      >
        {selectedParameter ? (
          <ProForm
            layout="vertical"
            initialValues={selectedParameter}
            onFinish={async () => {
              message.success("参数变更已保存到静态草稿");
              setSelectedParameter(null);
              return true;
            }}
            submitter={{
              render: (_, dom) => <Space>{dom}</Space>,
            }}
          >
            <ProFormText name="name" label="参数名称" readonly />
            <ProFormText name="key" label="参数键" readonly />
            <ProFormText
              name="value"
              label="参数值"
              rules={[{ required: true, message: "请输入参数值" }]}
            />
            <ProFormTextArea name="description" label="说明" />
          </ProForm>
        ) : null}
      </Drawer>
    </div>
  );
}
