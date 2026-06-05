import { EyeOutlined, SaveOutlined, UserAddOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { ProCard, ProTable } from "@ant-design/pro-components";
import {
  App,
  Button,
  Checkbox,
  Drawer,
  Empty,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import {
  type AdminUser,
  adminUsers,
  permissions,
  rolePermissions,
} from "./data";

const statusText: Record<AdminUser["status"], string> = {
  active: "启用",
  locked: "锁定",
  pending: "待确认",
};

const statusColor: Record<AdminUser["status"], string> = {
  active: "success",
  locked: "error",
  pending: "processing",
};

export default function AdminAuthPage() {
  const { message } = App.useApp();
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      rolePermissions.map((role) => [role.id, role.permissions]),
    ),
  );

  const userColumns: ProColumns<AdminUser>[] = [
    {
      title: "用户名",
      dataIndex: "username",
      width: 150,
      fixed: "left",
      render: (_, record) => (
        <Button type="link" onClick={() => setActiveUser(record)}>
          {record.username}
        </Button>
      ),
    },
    {
      title: "显示名称",
      dataIndex: "displayName",
      width: 150,
      ellipsis: true,
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 220,
      ellipsis: true,
    },
    {
      title: "部门",
      dataIndex: "department",
      width: 160,
    },
    {
      title: "角色",
      dataIndex: "roles",
      width: 220,
      search: false,
      render: (_, record) => (
        <Space size={[6, 6]} wrap>
          {record.roles.map((role) => (
            <Tag key={role} color="green">
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      valueType: "select",
      width: 120,
      valueEnum: {
        active: { text: "启用", status: "Success" },
        locked: { text: "锁定", status: "Error" },
        pending: { text: "待确认", status: "Processing" },
      },
      render: (_, record) => (
        <Tag color={statusColor[record.status]}>
          {statusText[record.status]}
        </Tag>
      ),
    },
    {
      title: "最近登录",
      dataIndex: "lastLogin",
      valueType: "dateTime",
      width: 170,
      search: false,
    },
    {
      title: "操作",
      valueType: "option",
      width: 120,
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => setActiveUser(record)}
        >
          查看
        </Button>,
      ],
    },
  ];

  const userStats = useMemo(
    () => ({
      active: adminUsers.filter((user) => user.status === "active").length,
      locked: adminUsers.filter((user) => user.status === "locked").length,
      roles: rolePermissions.length,
    }),
    [],
  );

  return (
    <div className="admin-page-stack">
      <Tabs
        className="admin-auth-tabs"
        items={[
          {
            key: "users",
            label: "用户管理",
            children: (
              <div className="admin-page-stack">
                <ProCard.Group gutter={16} className="admin-stat-row">
                  <ProCard title="启用账号">
                    <Typography.Title level={2}>
                      {userStats.active}
                    </Typography.Title>
                  </ProCard>
                  <ProCard title="锁定账号">
                    <Typography.Title level={2}>
                      {userStats.locked}
                    </Typography.Title>
                  </ProCard>
                  <ProCard title="角色数量">
                    <Typography.Title level={2}>
                      {userStats.roles}
                    </Typography.Title>
                  </ProCard>
                </ProCard.Group>
                <ProTable<AdminUser>
                  className="admin-table"
                  rowKey="id"
                  headerTitle="用户列表"
                  columns={userColumns}
                  dataSource={adminUsers}
                  cardBordered
                  options={false}
                  pagination={false}
                  scroll={{ x: 1280 }}
                  search={false}
                  toolBarRender={() => [
                    <Button
                      key="create"
                      type="primary"
                      icon={<UserAddOutlined />}
                    >
                      新建用户
                    </Button>,
                  ]}
                />
              </div>
            ),
          },
          {
            key: "roles",
            label: "角色权限配置",
            children: (
              <div className="admin-role-grid">
                {rolePermissions.map((role) => (
                  <ProCard
                    key={role.id}
                    title={role.name}
                    extra={<Tag color="blue">{role.userCount} 人</Tag>}
                  >
                    <Typography.Paragraph type="secondary">
                      {role.scope}
                    </Typography.Paragraph>
                    <Checkbox.Group
                      className="admin-permission-list"
                      value={roleDrafts[role.id]}
                      options={permissions.map((permission) => ({
                        label: (
                          <span className="admin-permission-option">
                            <Typography.Text strong>
                              {permission.label}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {permission.description}
                            </Typography.Text>
                          </span>
                        ),
                        value: permission.id,
                      }))}
                      onChange={(values) => {
                        setRoleDrafts((current) => ({
                          ...current,
                          [role.id]: values.map(String),
                        }));
                      }}
                    />
                    <div className="admin-card-actions">
                      <Button
                        icon={<SaveOutlined />}
                        onClick={() =>
                          message.success(`${role.name}权限已保存到静态草稿`)
                        }
                      >
                        保存权限
                      </Button>
                    </div>
                  </ProCard>
                ))}
              </div>
            ),
          },
        ]}
      />

      <Drawer
        title="用户详情"
        open={Boolean(activeUser)}
        onClose={() => setActiveUser(null)}
        size="large"
      >
        {activeUser ? (
          <div className="admin-user-drawer">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {activeUser.displayName}
            </Typography.Title>
            <Typography.Text type="secondary">
              {activeUser.email}
            </Typography.Text>
            <dl>
              <dt>用户名</dt>
              <dd>{activeUser.username}</dd>
              <dt>部门</dt>
              <dd>{activeUser.department}</dd>
              <dt>状态</dt>
              <dd>
                <Tag color={statusColor[activeUser.status]}>
                  {statusText[activeUser.status]}
                </Tag>
              </dd>
              <dt>最近登录</dt>
              <dd>{activeUser.lastLogin}</dd>
              <dt>角色</dt>
              <dd>
                <Space size={[6, 6]} wrap>
                  {activeUser.roles.map((role) => (
                    <Tag key={role} color="green">
                      {role}
                    </Tag>
                  ))}
                </Space>
              </dd>
            </dl>
          </div>
        ) : (
          <Empty />
        )}
      </Drawer>
    </div>
  );
}
