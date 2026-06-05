import { CloseOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import {
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import { App, Button, Drawer, Form, Skeleton, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { AdminSettings, AdminSettingsUpdate } from "../types";

interface BasicSettingValues {
  systemName: string;
  allowRegistration: boolean;
  defaultCenterLon: number;
  defaultCenterLat: number;
  defaultZoom: number;
  defaultBasemap: string;
  mapboxAccessToken: string;
  uploadMaxMb: number;
  queryResultLimit: number;
  symbolizerTimeoutSeconds: number;
}

interface SystemParameter {
  id: string;
  name: string;
  key: string;
  value: string;
  category: string;
  scope: string;
  restartRequired: boolean;
  description: string;
}

const parameterDefinitions: Omit<SystemParameter, "value">[] = [
  {
    id: "param-system-name",
    name: "系统名称",
    key: "application.system.name",
    category: "基础配置",
    scope: "前台展示",
    restartRequired: false,
    description: "用于浏览器标题、门户页和后台顶部栏展示。",
  },
  {
    id: "param-registration",
    name: "开放注册",
    key: "application.system.allow_registration",
    category: "基础配置",
    scope: "认证",
    restartRequired: false,
    description: "控制统一登录页是否展示注册入口。",
  },
  {
    id: "param-basemap",
    name: "默认底图",
    key: "application.map.default_basemap",
    category: "基础配置",
    scope: "地图",
    restartRequired: false,
    description: "控制地图页初始化时使用的默认底图类型。",
  },
  {
    id: "param-upload-limit",
    name: "上传上限",
    key: "application.limits.upload_max_mb",
    category: "参数管理",
    scope: "文件上传",
    restartRequired: false,
    description: "控制单次上传文件大小上限，单位 MB。",
  },
  {
    id: "param-query-limit",
    name: "查询结果上限",
    key: "application.limits.query_result_limit",
    category: "参数管理",
    scope: "数据查询",
    restartRequired: false,
    description: "单次查询允许返回的最大记录数。",
  },
  {
    id: "param-raster-timeout",
    name: "栅格脚本超时",
    key: "application.raster.symbolizer_timeout_seconds",
    category: "参数管理",
    scope: "栅格出图",
    restartRequired: true,
    description: "统一符号化脚本调用的超时时间，单位秒。",
  },
];

export default function AdminSystemSettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<BasicSettingValues>();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedParameter, setSelectedParameter] =
    useState<SystemParameter | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const data = await api.adminSettings();
        if (!mounted) return;
        setSettings(data);
        form.setFieldsValue(valuesFromSettings(data));
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : "系统设置加载失败",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadSettings();
    return () => {
      mounted = false;
    };
  }, [form, message]);

  const parameters = useMemo(() => {
    if (!settings) return [];
    const valueMap: Record<string, string> = {
      "application.system.name": settings.systemName,
      "application.system.allow_registration": String(
        settings.allowRegistration,
      ),
      "application.map.default_basemap": settings.map.defaultBasemap,
      "application.limits.upload_max_mb": String(settings.limits.uploadMaxMb),
      "application.limits.query_result_limit": String(
        settings.limits.queryResultLimit,
      ),
      "application.raster.symbolizer_timeout_seconds": String(
        settings.raster.symbolizerTimeoutSeconds,
      ),
    };
    return parameterDefinitions.map((parameter) => ({
      ...parameter,
      value: valueMap[parameter.key] ?? "",
    }));
  }, [settings]);

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
      width: 260,
      render: (_, record) => (
        <Typography.Text code copyable>
          {record.key}
        </Typography.Text>
      ),
    },
    {
      title: "当前值",
      dataIndex: "value",
      width: 220,
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
      title: "生效方式",
      dataIndex: "restartRequired",
      width: 110,
      render: (_, record) =>
        record.restartRequired ? (
          <Tag color="orange">重启</Tag>
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
          disabled={!settings?.editable}
        >
          编辑
        </Button>,
      ],
    },
  ];

  async function handleSave(values: BasicSettingValues) {
    const payload: AdminSettingsUpdate = {
      systemName: values.systemName,
      allowRegistration: values.allowRegistration,
      map: {
        defaultCenter: [values.defaultCenterLon, values.defaultCenterLat],
        defaultZoom: values.defaultZoom,
        defaultBasemap: values.defaultBasemap,
        mapboxAccessToken: values.mapboxAccessToken,
      },
      limits: {
        uploadMaxMb: values.uploadMaxMb,
        queryResultLimit: values.queryResultLimit,
      },
      raster: {
        symbolizerTimeoutSeconds: values.symbolizerTimeoutSeconds,
      },
    };
    const updated = await api.updateAdminSettings(payload);
    setSettings(updated);
    form.setFieldsValue(valuesFromSettings(updated));
    setEditing(false);
    message.success("系统设置已写入运行配置");
    return true;
  }

  if (loading) {
    return (
      <ProCard className="admin-section-card">
        <Skeleton active paragraph={{ rows: 8 }} />
      </ProCard>
    );
  }

  return (
    <div className="admin-page-stack">
      <ProCard
        title="基础配置"
        className="admin-section-card"
        extra={
          editing ? (
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={() => {
                if (settings) {
                  form.setFieldsValue(valuesFromSettings(settings));
                }
                setEditing(false);
              }}
            >
              取消
            </Button>
          ) : (
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={!settings?.editable}
              onClick={() => setEditing(true)}
            >
              编辑
            </Button>
          )
        }
      >
        <ProForm<BasicSettingValues>
          form={form}
          layout="horizontal"
          grid
          readonly={!editing || !settings?.editable}
          onFinish={handleSave}
          submitter={
            editing && settings?.editable
              ? {
                  searchConfig: {
                    submitText: "保存配置",
                    resetText: "重置",
                  },
                  submitButtonProps: {
                    icon: <SaveOutlined />,
                  },
                }
              : false
          }
        >
          <ProFormText
            name="systemName"
            label="系统名称"
            colProps={{ xs: 24, md: 12 }}
            rules={[{ required: true, message: "请输入系统名称" }]}
          />
          <ProFormSwitch
            name="allowRegistration"
            label="开放注册"
            colProps={{ xs: 24, md: 12 }}
          />
          <ProFormDigit
            name="defaultCenterLon"
            label="默认经度"
            colProps={{ xs: 24, md: 12 }}
            min={-180}
            max={180}
          />
          <ProFormDigit
            name="defaultCenterLat"
            label="默认纬度"
            colProps={{ xs: 24, md: 12 }}
            min={-90}
            max={90}
          />
          <ProFormDigit
            name="defaultZoom"
            label="默认缩放"
            colProps={{ xs: 24, md: 12 }}
            min={1}
            max={22}
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
          <ProFormText
            name="mapboxAccessToken"
            label="Mapbox Token"
            colProps={{ xs: 24 }}
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
          <ProFormDigit
            name="symbolizerTimeoutSeconds"
            label="栅格超时秒数"
            colProps={{ xs: 24, md: 12 }}
            min={10}
            max={600}
          />
        </ProForm>
      </ProCard>

      <ProTable<SystemParameter>
        className="admin-table"
        rowKey="id"
        headerTitle="参数管理"
        columns={parameterColumns}
        dataSource={parameters}
        search={false}
        options={false}
        cardBordered
        pagination={false}
        scroll={{ x: 1400 }}
      />

      <Drawer
        title="参数详情"
        open={Boolean(selectedParameter)}
        onClose={() => setSelectedParameter(null)}
        size="large"
        extra={
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={!settings?.editable}
            onClick={() => {
              setSelectedParameter(null);
              setEditing(true);
            }}
          >
            编辑基础配置
          </Button>
        }
      >
        {selectedParameter ? (
          <ProForm
            layout="vertical"
            readonly
            initialValues={selectedParameter}
            submitter={false}
          >
            <ProFormText name="name" label="参数名称" readonly />
            <ProFormText name="key" label="参数键" readonly />
            <ProFormText name="value" label="参数值" readonly />
          </ProForm>
        ) : null}
      </Drawer>
    </div>
  );
}

function valuesFromSettings(settings: AdminSettings): BasicSettingValues {
  const [defaultCenterLon = 80, defaultCenterLat = 41.5] =
    settings.map.defaultCenter;
  return {
    systemName: settings.systemName,
    allowRegistration: settings.allowRegistration,
    defaultCenterLon,
    defaultCenterLat,
    defaultZoom: settings.map.defaultZoom,
    defaultBasemap: settings.map.defaultBasemap,
    mapboxAccessToken: settings.map.mapboxAccessToken,
    uploadMaxMb: settings.limits.uploadMaxMb,
    queryResultLimit: settings.limits.queryResultLimit,
    symbolizerTimeoutSeconds: settings.raster.symbolizerTimeoutSeconds,
  };
}
