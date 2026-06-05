import {
  AuditOutlined,
  HomeOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { MenuDataItem, ProLayoutProps } from "@ant-design/pro-components";
import { PageContainer, ProLayout } from "@ant-design/pro-components";
import { Button, Tag } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAppContext } from "../contexts/AppContext";

const adminRoute: ProLayoutProps["route"] = {
  path: "/admin",
  routes: [
    {
      path: "/admin/logs",
      name: "操作日志",
      icon: <AuditOutlined />,
    },
    {
      path: "/admin/settings",
      name: "系统设置",
      icon: <SettingOutlined />,
    },
    {
      path: "/admin/auth",
      name: "认证授权",
      icon: <TeamOutlined />,
    },
  ],
};

const defaultPageMeta = {
  title: "操作日志",
  subTitle: "查询、筛选并导出关键操作记录",
};

const pageMeta: Record<string, { title: string; subTitle: string }> = {
  "/admin/logs": defaultPageMeta,
  "/admin/settings": {
    title: "系统设置",
    subTitle: "维护基础配置与平台运行参数",
  },
  "/admin/auth": {
    title: "认证授权",
    subTitle: "管理用户、角色和功能权限",
  },
};

export default function AdminLayout() {
  const { bootstrap, user, setUser } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const meta = pageMeta[location.pathname] ?? defaultPageMeta;

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // 退出接口异常时仍清空本地登录态。
    }
    setUser(null);
  }

  return (
    <ProLayout
      className="admin-pro-layout"
      title="生态保护管理"
      route={adminRoute}
      location={{ pathname: location.pathname }}
      layout="mix"
      fixSiderbar
      contentWidth="Fluid"
      colorPrimary="#2f7d62"
      menuItemRender={(item: MenuDataItem, dom) =>
        item.path ? <Link to={item.path}>{dom}</Link> : dom
      }
      onMenuHeaderClick={() => navigate("/")}
      token={{
        header: {
          colorBgHeader: "#173f39",
          colorHeaderTitle: "#ffffff",
          colorTextMenu: "rgba(255, 255, 255, 0.74)",
          colorTextMenuSelected: "#ffffff",
        },
        sider: {
          colorMenuBackground: "#fbfdfb",
          colorTextMenu: "#31423d",
          colorTextMenuSelected: "#173f39",
          colorBgMenuItemSelected: "rgba(47, 125, 98, 0.1)",
        },
      }}
      actionsRender={() => [
        <Button
          key="home"
          icon={<HomeOutlined />}
          onClick={() => navigate("/")}
        >
          业务入口
        </Button>,
        <Button key="legacy" href="/admin2/" target="_blank">
          旧版管理后台
        </Button>,
        <Button key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
          退出
        </Button>,
      ]}
      avatarProps={{
        icon: <SafetyCertificateOutlined />,
        title: user?.displayName ?? "未登录",
        render: (_, dom) => (
          <div className="admin-avatar-block">
            {dom}
            {user?.roles.map((role) => (
              <Tag key={role} color="green">
                {role}
              </Tag>
            ))}
          </div>
        ),
      }}
      menuFooterRender={() => (
        <div className="admin-menu-footer">{bootstrap.systemName}</div>
      )}
      pageTitleRender={false}
    >
      <PageContainer
        title={meta.title}
        subTitle={meta.subTitle}
        className="admin-page-container"
      >
        <Outlet />
      </PageContainer>
    </ProLayout>
  );
}
